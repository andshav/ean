import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  Stack,
  Heading,
  NumberInput,
  Text,
  HStack,
  Clipboard,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import * as XLSX from "xlsx";

import { toaster } from "./components/ui/toaster";
import { generateEANs } from "./utils/ean";
import FileUploadButton from "./components/ui/file-upload-button";
import {
  addCodeCollection,
  getLatestCodes,
  updateLatestDocument,
} from "./utils/firebase";

export default function App() {
  const [mask, setMask] = useState("160x");
  const [count, setCount] = useState(1);
  const [codes, setCodes] = useState<string[]>([]);
  const [usedCodes, setUsedCodes] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchUsedCodes();
  }, []);

  const fetchUsedCodes = async () => {
    const res = await getLatestCodes();
    setUsedCodes((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(res)) {
        return res;
      }
      return prev;
    });
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
    const worksheet = XLSX.utils.aoa_to_sheet(usedCodes.map((code) => [code]));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Codes");

    // Создание XLSX файла
    XLSX.writeFile(workbook, "codes.xlsx");
  };

  const handleUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const codes = XLSX.utils
        .sheet_to_json(worksheet, { header: 1 })
        .flat() as string[];

      try {
        await addCodeCollection(codes);
        toaster.success({
          title: "Добавлен новый список",
        });
        fetchUsedCodes();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        toaster.error({
          title: "Ошибка загрузки файла",
          description: e?.message,
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (usedCodes.length === 0) {
      return;
    }

    const asyncUpdate = async () => {
      try {
        await updateLatestDocument(usedCodes);
        toaster.success({ title: "Список успешно обновлен" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        toaster.error({
          title: "Ошибка обновления списка",
          description: e?.message,
        });
      } finally {
        setIsGenerating(false);
      }
    };

    setIsGenerating(true);
    asyncUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes]);

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
        <Button onClick={handleGenerate} colorPalette="blue">
          Сгенерировать
        </Button>
        {codes.length > 0 && (
          <VStack gap={2}>
            {codes.map((code) => (
              <HStack
                key={code}
                width="full"
                justifyContent="space-between"
                borderWidth={1}
                p={2}
                borderRadius="md"
              >
                <Text>{code}</Text>
                <Clipboard.Root value={code} timeout={Infinity}>
                  <Clipboard.Trigger asChild>
                    <IconButton variant="surface" size="xs">
                      <Clipboard.Indicator />
                    </IconButton>
                  </Clipboard.Trigger>
                </Clipboard.Root>
              </HStack>
            ))}
          </VStack>
        )}

        <Button onClick={handleDownload} colorPalette="green">
          Скачать список кодов
        </Button>

        <FileUploadButton onFileSelected={handleUpload} />

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

            {usedCodes.length === 0 && (
              <Text textAlign="center" color="GrayText">
                Пока что пусто
              </Text>
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
