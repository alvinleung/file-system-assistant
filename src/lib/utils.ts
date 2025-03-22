import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const mapSet = <T, U>(
  set: Set<T>,
  callback: (value: T, index: number) => U
): Set<U> => {
  const resultSet = new Set<U>();
  let index = 0;
  set.forEach((value) => {
    resultSet.add(callback(value, index));
    index++;
  });
  return resultSet;
};
