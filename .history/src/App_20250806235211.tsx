import React, { useEffect, useState, type ChangeEvent } from "react";
import {
  Box,
  Button,
  Input,
  Heading,
  VStack,
  NumberInput,
} from "@chakra-ui/react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const EANGenerator: React.FC = () => {
  const [allCodes, setAllCodes] = useState<string[]>([]);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [mask, setMask] = useState<string>("460255xxxxxx");
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    fetch("/codes.xlsx")
      .then((response) => response.arrayBuffer())
      .then((data) => {
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const loadedCodes = XLSX.utils
          .sheet_to_json<string[]>(worksheet, { header: 1 })
          .map((row) => row[0]);
        setAllCodes(loadedCodes);
      })
      .catch((error) => {
        console.error("Error loading Excel file:", error);
      });
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Update current codes and save new file
      setAllCodes(loadedCodes);
      saveCurrentFile(data);

      // Archive old file with timestamp
      archiveOldFile();
    };

    reader.readAsArrayBuffer(file);
  };

  const archiveOldFile = () => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[T:\.]/g, "-")
      .slice(0, 19);
    const oldFileName = `codes_old_${timestamp}.xlsx`;

    // For demonstration, you would use server logic or file system package to rename/move the file
    console.log(`Archiving old file as: ${oldFileName}`);
    // This would typically involve backend logic to actually move/rename the file
  };

  const saveCurrentFile = (data: ArrayBuffer) => {
    // Save the new uploaded file as current_codes.xlsx
    const newBlob = new Blob([data], { type: "application/octet-stream" });
    saveAs(newBlob, "current_codes.xlsx");
  };

  const generateCodes = () => {
    const generatedCodes: string[] = [];
    while (generatedCodes.length < quantity) {
      const randomPart = Array.from(
        { length: (mask.match(/x/g) || []).length },
        () => Math.floor(Math.random() * 10)
      ).join("");

      const baseCode = mask.replace(
        /x/g,
        (_, idx) => randomPart.split("")[idx % randomPart.length]
      );
      const checkDigit = calculateCheckDigit(baseCode);
      const newCode = `${baseCode}${checkDigit}`;

      if (!allCodes.includes(newCode) && !generatedCodes.includes(newCode)) {
        generatedCodes.push(newCode);
      }
    }
    setAllCodes((prevCodes) => [...prevCodes, ...generatedCodes]);
    setNewCodes(generatedCodes);
  };

  const calculateCheckDigit = (code: string): number => {
    const digits = code.split("").map(Number);
    const sum = digits.reduce(
      (acc, num, idx) => acc + num * (idx % 2 === 0 ? 1 : 3),
      0
    );
    return (10 - (sum % 10)) % 10;
  };

  const downloadCodes = () => {
    const worksheet = XLSX.utils.aoa_to_sheet(allCodes.map((code) => [code]));
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
    <VStack gap={4} mt={5}>
      <Heading>EAN Code Generator</Heading>
      <Input type="file" accept=".xlsx" onChange={handleFileUpload} />
      <Input
        placeholder="Enter the mask (e.g., 460255xxxxxx)"
        value={mask}
        onChange={(e) => setMask(e.target.value)}
      />
      <NumberInput.Root
        onValueChange={(e) => setQuantity(+e.value)}
        defaultValue={`${quantity}`}
      >
        <NumberInput.Control />
        <NumberInput.Input />
      </NumberInput.Root>
      <Button colorScheme="teal" onClick={generateCodes}>
        Generate EAN Codes
      </Button>
      <Button colorScheme="blue" onClick={downloadCodes}>
        Download Codes
      </Button>
      <Box>
        {newCodes.map((code, index) => (
          <Box key={index} p={2} borderWidth={1} borderRadius="md" mt={1}>
            {code}
          </Box>
        ))}
      </Box>
    </VStack>
  );
};

export default EANGenerator;
