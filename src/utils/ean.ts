// Генерация контрольной цифры EAN-13
export function calculateEAN13Checksum(code: string): string {
  const digits = code.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const checksum = (10 - (sum % 10)) % 10;
  return checksum.toString();
}

export const generateEANs = (
  mask: string,
  count: number,
  usedCodes: string[]
) => {
  if (mask.length > 12) {
    throw new Error("Маска превышает 12 символов");
  }
  const generatedCodes: string[] = [];
  const formattedMask = mask.padEnd(12, "x");

  const getGeneratedPart = () =>
    Array.from({ length: (formattedMask.match(/x/g) || []).length }, () =>
      Math.floor(Math.random() * 10)
    ).join("");

  const getNextPart = () => {
    if (generatedCodes.length > 0) {
      const lastCode = generatedCodes[generatedCodes.length - 1];
      const next = `${+lastCode.slice(0, 12) + 1}`;

      if (usedCodes.includes(next) || generatedCodes.includes(next)) {
        return getGeneratedPart();
      }

      return next;
    }

    return getGeneratedPart();
  };

  let tries = 0;
  const maxTries = count * 2;

  while (generatedCodes.length < count && tries <= maxTries) {
    const randomPart = getNextPart();

    const baseCode = formattedMask.replace(
      /x/g,
      (_, idx) => randomPart.split("")[idx % randomPart.length]
    );
    const checkDigit = calculateEAN13Checksum(baseCode);
    const newCode = `${baseCode}${checkDigit}`;

    if (!usedCodes.includes(newCode) && !generatedCodes.includes(newCode)) {
      generatedCodes.push(newCode);
    }
    tries++;
  }

  if (tries > maxTries) {
    throw new Error("Не получилось создать уникальные коды, измените маску");
  }

  return generatedCodes;
};
