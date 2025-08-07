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
  Span,
  FileUpload,
  ProgressCircle,
} from "@chakra-ui/react";
import * as XLSX from "xlsx";

import { toaster } from "./components/ui/toaster";
import { generateEANs } from "./utils/ean";

import {
  addCodeCollection,
  getLatestCodes,
  updateLatestDocument,
} from "./utils/firebase";
import { HiDownload, HiUpload } from "react-icons/hi";
import { FaMagic } from "react-icons/fa";

export default function App() {
  const [mask, setMask] = useState("160x");
  const [count, setCount] = useState(1);
  const [codes, setCodes] = useState<string[]>([]);
  const [usedCodes, setUsedCodes] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchUsedCodes();
  }, []);

  const fetchUsedCodes = async () => {
    if (isFetching) {
      return;
    }
    setIsFetching(true);
    try {
      const res = await getLatestCodes();
      setUsedCodes((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(res)) {
          return res;
        }
        return prev;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toaster.error({
        title: "Ошибка загрузки списка",
        description: e?.message,
      });
    } finally {
      setIsFetching(false);
    }
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
        .flat()
        .map(String) as string[];

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

  const renderUsedCodes = () => {
    if (isFetching) {
      return (
        <Stack justifyContent="center" alignItems="center" p={10}>
          <ProgressCircle.Root value={null}>
            <ProgressCircle.Circle>
              <ProgressCircle.Track />
              <ProgressCircle.Range />
            </ProgressCircle.Circle>
          </ProgressCircle.Root>
        </Stack>
      );
    }

    if (usedCodes.length === 0) {
      return (
        <Text textAlign="center" color="GrayText">
          Пока что пусто
        </Text>
      );
    }

    return (
      <>
        {usedCodes.map((code) => (
          <Text key={code}>{code}</Text>
        ))}
      </>
    );
  };

  return (
    <Box
      maxW="700px"
      mx="auto"
      mt={[0, 10]}
      p={6}
      borderWidth={[0, 2]}
      borderRadius="lg"
    >
      <Heading mb={4}>Генерация EAN-кодов</Heading>
      <Stack gap={2}>
        <Box>
          <Text>Маска</Text>
          <Input
            defaultValue={mask}
            maxLength={12}
            onBlur={(e) => setMask(e.target.value)}
          />
        </Box>
        <Box>
          <Text>Количество кодов</Text>
          <NumberInput.Root defaultValue={`${count}`} max={1000}>
            <NumberInput.Control />
            <NumberInput.Input
              onBlur={(e) => {
                setCount(+e.target.value);
              }}
            />
          </NumberInput.Root>
        </Box>
        <Stack mb={4}>
          <Button onClick={handleGenerate} colorPalette="blue" size={"2xl"}>
            <FaMagic /> Сгенерировать
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
        </Stack>

        <Button onClick={handleDownload} colorPalette="green">
          <HiDownload /> Скачать список
        </Button>

        <FileUpload.Root
          accept=".xlsx"
          onFileChange={(e) => {
            const file = e.acceptedFiles[0];
            if (file) {
              handleUpload(file);
            }
          }}
        >
          <FileUpload.HiddenInput />
          <FileUpload.Trigger asChild>
            <Button width="full" colorPalette="orange">
              <HiUpload /> Загрузить новый список
            </Button>
          </FileUpload.Trigger>
        </FileUpload.Root>

        <Box mt={4}>
          <Span>
            <Span fontWeight="bold">Использованные коды </Span>
            {!isFetching && (
              <Span mt={4} fontWeight="bold">
                ({usedCodes.length})
              </Span>
            )}
          </Span>

          <Box
            maxH="200px"
            overflowY="auto"
            borderWidth={1}
            p={2}
            borderRadius="md"
            mt={2}
          >
            {renderUsedCodes()}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
