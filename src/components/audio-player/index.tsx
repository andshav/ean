import { Box, Button } from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { HiPause, HiPlay } from "react-icons/hi";

import audio from "../../assets/audio/soldat.mp3";

const AudioPlayer = () => {
  // Ссылка для управления аудио компонентом
  const audioRef = useRef<HTMLAudioElement>(null);
  // Состояние для управления воспроизведением
  const [isPlaying, setIsPlaying] = useState<boolean>();

  const localIsPlaying = localStorage.getItem("audio") === "true";

  // Функция для запуска и остановки воспроизведения
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        localStorage.setItem("audio", "true");
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime === 0) {
      audio.currentTime = 25;
    }
    const handleAutoplay = () => {
      if (isPlaying === undefined && !localIsPlaying) {
        togglePlayback();
      }
    };
    document.addEventListener("click", handleAutoplay);

    return () => {
      document.removeEventListener("click", handleAutoplay);
    };
  }, [isPlaying, localIsPlaying]);

  return (
    <Box width="full">
      <audio ref={audioRef} src={audio} preload="auto" />
      <Button
        onClick={togglePlayback}
        mt={6}
        colorPalette="pink"
        width="full"
        size="2xl"
      >
        {isPlaying ? <HiPause /> : <HiPlay />} {isPlaying ? "Pause" : "Play"}
      </Button>
    </Box>
  );
};

export default AudioPlayer;
