import { useEffect, useState } from "react";

const words = ["Learn Together", "Build Together", "Grow Together"];

function HeroTyping() {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const speed = isDeleting ? 60 : 120;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        const newText = currentWord.substring(0, text.length + 1);
        setText(newText);

        if (newText === currentWord) {
          setTimeout(() => setIsDeleting(true), 1200);
        }
      } else {
        const newText = currentWord.substring(0, text.length - 1);
        setText(newText);

        if (newText === "") {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex]);

  return (
    <span className="text-indigo-400 border-r-4 pr-2 animate-pulse">
      {text}
    </span>
  );
}

export default HeroTyping;