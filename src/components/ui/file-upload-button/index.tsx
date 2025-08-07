import React, { useRef } from "react";
import { Button } from "@chakra-ui/react";

const FileUploadButton: React.FC<{ onFileSelected: (file: File) => void }> = ({
  onFileSelected,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      // Если хотите, сбрасывайте value, чтобы можно было выбрать тот же файл повторно
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <Button colorPalette="orange" onClick={handleButtonClick}>
        Загрузить новый список
      </Button>
    </>
  );
};

export default FileUploadButton;
