import { useState, useEffect, useRef } from "react";
import { Playfair_Display } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import Fireworks from "@fireworks-js/react";
import Image from "next/image";

const playfairDisplay = Playfair_Display({
  display: "swap",
  subsets: ["latin"],
});

// Typewriter effect component - types character by character with sound
function TypewriterText({ 
  text, 
  speed = 70,
  onComplete 
}: { 
  text: string; 
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/freesound_community-typewriter-170428_1482-22815.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Start/stop sound based on typing state
  useEffect(() => {
    if (currentIndex > 0 && currentIndex < text.length && audioRef.current && !isComplete) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentIndex, text.length, isComplete]);

  // Stop audio when complete
  useEffect(() => {
    if (isComplete && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isComplete]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        const char = text[currentIndex];
        setDisplayedText((prev) => prev + char);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (!isComplete && currentIndex >= text.length) {
      const completeTimer = setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 0);
      return () => clearTimeout(completeTimer);
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  return (
    <span className="whitespace-pre-wrap text-center max-w-4xl uppercase">
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// 36 images
const images = [
  "/game-photos/1.avif",
  "/game-photos/2.avif",
  "/game-photos/3.avif",
  "/game-photos/4.avif",
  "/game-photos/5.avif",
  "/game-photos/6.avif",
  "/game-photos/7.avif",
  "/game-photos/8.avif",
  "/game-photos/9.avif",
  "/game-photos/10.avif",
  "/game-photos/11.avif",
  "/game-photos/12.avif",
  "/game-photos/13.avif",
  "/game-photos/14.avif",
  "/game-photos/15.avif",
  "/game-photos/16.avif",
  "/game-photos/17.avif",
  "/game-photos/18.avif",
  "/game-photos/19.avif",
  "/game-photos/20.avif",
  "/game-photos/21.avif",
  "/game-photos/22.avif",
  "/game-photos/23.avif",
  "/game-photos/24.avif",
  "/game-photos/25.avif",
  "/game-photos/26.avif",
  "/game-photos/27.avif",
  "/game-photos/28.avif",
  "/game-photos/29.avif",
  "/game-photos/30.avif",
  "/game-photos/31.avif",
  "/game-photos/32.avif",
  "/game-photos/33.avif",
  "/game-photos/34.avif",
  "/game-photos/35.avif",
  "/game-photos/36.avif",
];

export default function ValentinesProposal() {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState<{
    top: string;
    left: string;
  } | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [textComplete, setTextComplete] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const getRandomPosition = () => {
    const randomTop = Math.random() * 40 + 30; // Less aggressive: 30-70% range
    const randomLeft = Math.random() * 40 + 30; // Less aggressive: 30-70% range
    return { top: `${randomTop}%`, left: `${randomLeft}%` };
  };

  const handleNoClick = () => {
    setShowCountdown(true);
    setCountdown(3);
  };

  const handleCancelCountdown = () => {
    setShowCountdown(false);
    setCountdown(3);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  useEffect(() => {
    if (showCountdown && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => {
        if (countdownRef.current) clearTimeout(countdownRef.current);
      };
    } else if (showCountdown && countdown === 0) {
      window.close();
    }
  }, [showCountdown, countdown]);

  useEffect(() => {
    if (step < 2) {
      // Change step after 3 seconds
      const timer = setTimeout(() => {
        setStep((prevStep) => prevStep + 1);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleYesClick = () => {
    setStep(3);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.h2
            key="step-0"
            className={`text-4xl font-semibold mb-4 ${playfairDisplay.className}`}
            transition={{ duration: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Good Girl hahaha. I need to ask you something.
          </motion.h2>
        )}
        {step === 1 && (
          <motion.h2
            key="step-1"
            className={`text-4xl font-semibold mb-4 ${playfairDisplay.className}`}
            transition={{ duration: 3 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            I have a surprise for you!
          </motion.h2>
        )}
        {step === 2 && (
          <motion.div
            key="step-2"
            transition={{ duration: 3 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            {/* Image Grid Background */}
            <div className="absolute inset-0 grid grid-cols-6 opacity-10">
              {images.slice(0, 36).map((src, index) => (
                <div key={index} className="relative h-full">
                  <Image
                    src={src}
                    alt={`Memory ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <h2
              className={`text-5xl font-semibold mb-8 ${playfairDisplay.className}`}
            >
              Will you be my Valentine?
            </h2>
            <Image
              src="/silly.jpg"
              alt="Cute Cat"
              width={400}
              height={400}
            />
            <div className="flex space-x-4 mt-10">
              <button
                className="px-6 py-2 text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl hover:from-pink-600 hover:to-rose-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={handleYesClick}
              >
                Yes, I will ٩(ˊᗜˋ*)و ♡
              </button>
              <button
                className="px-6 py-2 text-lg font-semibold text-white bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-95 transition-all duration-300 shadow-lg"
                style={{
                  ...(position
                    ? {
                        position: "absolute" as const,
                        top: position.top,
                        left: position.left,
                      }
                    : {}),
                  transition: "top 0.3s ease, left 0.3s ease", // Slower movement
                }}
                onMouseEnter={() => {
                  // Only move 50% of the time to make it easier to click
                  if (Math.random() > 0.5) {
                    setPosition(getRandomPosition());
                  }
                }}
                onClick={handleNoClick}
              >
                No, I won&apos;t ( • ᴖ • ｡)
              </button>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div
            key="step-3"
            className={`text-lg md:text-xl font-semibold mb-4 flex flex-col justify-center items-center px-4 md:px-8 ${playfairDisplay.className}`}
            transition={{ duration: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TypewriterText
              text={`If only you could see yourself
through my eyes...

Perhaps then you would understand
why I marvel at your beauty so quietly.

Why your presence steals my words,
While leaving my heart full
of things it longs to say.

If you could see yourself through my eyes,
you would understand
why I believe in Fate.

Because your existence feels Deliberate,
Crafted with intention, Touched with care,
shaped by a hand that knew exactly what it was doing.

You're not an accident.
You're grace made visible.
A testament to divine patience and gentle design.

If only you could see yourself through my eyes...

I love you, My dearest Sabina

From your boyfriend`}
              speed={100}
              onComplete={() => {
                setTextComplete(true);
                setTimeout(() => setShowFireworks(true), 500);
              }}
            />
            <motion.p 
              className="text-sm mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: textComplete ? 1 : 0 }}
              transition={{ delay: 1 }}
            >
              I&apos;m always here for you, my love. 💌
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: textComplete ? 1 : 0, scale: textComplete ? 1 : 0.8 }}
              transition={{ delay: 1.5 }}
            >
              <Image
                src="/hamster_jumping.gif"
                alt="Hamster Feliz"
                width={200}
                height={200}
                unoptimized
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showFireworks && (
        <div className="absolute w-full h-full">
          <Fireworks
            options={{
              autoresize: true,
            }}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        </div>
      )}

      {/* Countdown Modal */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <p className={`text-3xl text-white mb-4 ${playfairDisplay.className}`}>
                Ok. Fine...
              </p>
              <motion.p
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-9xl font-bold text-red-500"
              >
                {countdown}
              </motion.p>
              <p className="text-white mt-4 mb-8">Closing in {countdown} seconds...</p>
              <button
                onClick={handleCancelCountdown}
                className="px-8 py-3 text-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                CANCEL! I changed my mind!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
