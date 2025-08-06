import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  Stack,
  Heading,
  NumberInput,
  Text,
} from "@chakra-ui/react";
import axios from "axios";
import * as XLSX from "xlsx";

import { toaster } from "./components/ui/toaster";
import { generateEANs } from "./utils/ean";

const API = "https://ean-back.onrender.com/api";

export default function App() {
  const [mask, setMask] = useState("160x");
  const [count, setCount] = useState(1);
  const [codes, setCodes] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [usedCodes, setUsedCodes] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchUsedCodes();
  }, []);

  const fetchUsedCodes = async () => {
    const res = await axios.get<string[]>(`${API}/codes`);
    setUsedCodes(res.data);
  };

  const handleGenerate = async () => {
    if (isGenerating) {
      return;
    }
    try {
      setIsGenerating(true);
      const newCodes = generateEANs(mask, count, usedCodes);
      setCodes(newCodes);
      setUsedCodes((prev) => [...prev, ...newCodes]);
      toaster.success({ title: "Коды сгенерированы" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toaster.error({
        title: "Ошибка генерации",
        description: e?.message,
      });
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    window.open(`${API}/codes/download`, "_blank");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`${API}/codes/upload`, formData);
    fetchUsedCodes();
    toaster.success({ title: "Файл загружен" });
  };

  // Сохранить новые коды в XLSX и отправить на сервер
  const handleSaveToServer = async () => {
    if (codes.length === 0) return;
    setIsGenerating(true);
    // Загрузить существующие коды
    const allCodes = usedCodes.map((code) => [code]);
    console.log({ usedCodes });
    const ws = XLSX.utils.aoa_to_sheet(allCodes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Codes");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("file", new File([blob], "ean_codes.xlsx"));
    try {
      await axios.post(`${API}/codes/update`, formData);
      toaster.success({ title: "Коды добавлены и сохранены" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toaster.error({
        title: e.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    handleSaveToServer();
  }, [usedCodes]);

  return (
    <Box maxW="700px" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
      <Heading mb={4}>Генерация EAN-кодов</Heading>
      <Stack gap={4}>
        <Box>
          <Text>Маска</Text>
          <Input
            value={mask}
            onChange={(e) => setMask(e.target.value)}
            maxLength={12}
          />
        </Box>
        <Box>
          <Text>Количество кодов</Text>
          <NumberInput.Root
            onValueChange={(e) => setCount(+e.value)}
            defaultValue={`${count}`}
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
        </Box>
        <Button colorScheme="blue" onClick={handleGenerate}>
          Сгенерировать
        </Button>
        {codes.length > 0 && (
          <Box>
            {codes.map((code, index) => (
              <Box key={index} p={2} borderWidth={1} borderRadius="md" mt={1}>
                {code}
              </Box>
            ))}
          </Box>
        )}
        <Box>
          <Button onClick={handleDownload} colorScheme="green" mr={2}>
            Скачать xlsx
          </Button>
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            display="inline-block"
            width="auto"
          />
          <Button onClick={handleUpload} colorScheme="orange" ml={2}>
            Загрузить новый xlsx
          </Button>
        </Box>
        <Box>
          <Text mt={4} fontWeight="bold">
            Использованные коды
          </Text>
          <Box
            maxH="200px"
            overflowY="auto"
            borderWidth={1}
            p={2}
            borderRadius="md"
          >
            {usedCodes.map((code) => (
              <Text key={code}>{code}</Text>
            ))}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
