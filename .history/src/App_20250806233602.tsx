import React, { useState, type ChangeEvent } from "react";
import { Box, Button, Input, Heading, VStack } from "@chakra-ui/react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const EANGenerator: React.FC = () => {
  const [codes, setCodes] = useState<string[]>([]);
  const [mask, setMask] = useState<string>("460255xxxxxx");
  const [quantity, setQuantity] = useState<number>(1);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const loadedCodes = XLSX.utils
        .sheet_to_json<string[]>(worksheet, { header: 1 })
        .map((row) => row[0]);
      setCodes(loadedCodes);
    };

    reader.readAsArrayBuffer(file);
  };

  const generateCodes = () => {
    const newCodes: string[] = [];
    while (newCodes.length < quantity) {
      const randomPart = Array.from(
        { length: (mask.match(/x/g) || []).length },
        () => Math.floor(Math.random() * 10)
      ).join("");

      const baseCode = mask.replace(/x/g, () => randomPart.slice(0, 1));
      const checkDigit = calculateCheckDigit(baseCode);
      const newCode = `${baseCode}${checkDigit}`;

      if (!codes.includes(newCode) && !newCodes.includes(newCode)) {
        newCodes.push(newCode);
      }
    }
    setCodes((prevCodes) => [...prevCodes, ...newCodes]);
  };

  const calculateCheckDigit = (code: string): number => {
    const digits = code.split("").map(Number);
    const sum = digits.reduce(
      (acc, num, idx) => acc + num * (idx % 2 === 0 ? 1 : 3),
      0
    );
    return (10 - (sum % 10)) % 10;
  };

  const isUniqueCode = (code: string): boolean => {
    return !codes.includes(code);
  };

  const downloadCodes = () => {
    const worksheet = XLSX.utils.aoa_to_sheet(codes.map((code) => [code]));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Codes");
    const workbookOut = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const timestamp = new Date()
      .toISOString()
      .replace(/[T:\.]/g, "-")
      .slice(0, 19);
    saveAs(new Blob([workbookOut]), `ean_codes_${timestamp}.xlsx`);
  };

  return (
    <VStack gap={5} mt={5}>
      <Heading>EAN Code Generator</Heading>
      <Input type="file" accept=".xlsx" onChange={handleFileUpload} />

      <Input type="file" accept=".xlsx" onChange={handleFileUpload} />
      <Input
        placeholder="Enter the mask (e.g., 460255xxxxxx)"
        value={mask}
        onChange={(e) => setMask(e.target.value)}
      />
      <Button colorScheme="teal" onClick={generateCode}>
        Generate EAN Code
      </Button>
      <Button colorScheme="blue" onClick={downloadCodes}>
        Download Codes
      </Button>
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
