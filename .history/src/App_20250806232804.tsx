import React, { useState } from 'react';
import { Box, Button, Input, Heading, VStack } from '@chakra-ui/react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const EANGenerator = () => {
  const [codes, setCodes] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const loadedCodes = XLSX.utils.sheet_to_json(sheet, { header: 1 }).map((row) => row[0]);
      setCodes(loadedCodes);
    };

    reader.readAsArrayBuffer(file);
  };

  const generateCode = () => {
    let code;
    do {
      const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
      const baseCode = 460255${randomPart};
      const checkDigit = calculateCheckDigit(baseCode);
      code = ${baseCode}${checkDigit};
    } while (codes.includes(code));

    setCodes((prevCodes) => [...prevCodes, code]);
  };

  const calculateCheckDigit = (code) => {
    const digits = code.split('').map(Number);
    const sum = digits.reduce((acc, digit, i) => acc + digit * (i % 2 === 0 ? 1 : 3), 0);
    return (10 - (sum % 10)) % 10;
  };

  const downloadCodes = () => {
    const worksheet = XLSX.utils.aoa_to_sheet(codes.map((code) => [code]));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Codes');
    const workbookOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const timestamp = new Date().toISOString().replace(/[T:\.]/g, '-').slice(0, 19);
    saveAs(new Blob([workbookOut], { type: 'application/octet-stream' }), ean_codes_${timestamp}.xlsx);
  };

  return (
    <VStack spacing={4} mt={5}>
      <Heading>EAN Code Generator</Heading>
      <Input type="file" accept=".xlsx" onChange={handleFileUpload} />
      <Button colorScheme="teal" onClick={generateCode}>Generate EAN Code</Button>
      <Button colorScheme="blue" onClick={downloadCodes}>Download Codes</Button>
      <Box>
        {codes.map((code, index) => (
          <Box key={index} p={2} borderWidth={1} borderRadius="md" mt={1}>
            {code}
          </Box>
        ))}
      </Box>
    </VStack>
  );
};

export default EANGenerator;