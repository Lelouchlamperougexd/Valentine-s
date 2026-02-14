"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PhotoPairGame from "../components/PhotoPairGame";
import HeartCameraPage from "@/components/HeartCameraPage";
import ValentinesProposal from "@/components/ValentinesProposal";
import TextFooter from "@/components/TextFooter";
import OrientationGuard from "@/components/OrientationGuard";
import MusicPlayer from "@/components/MusicPlayer";

const ANIM_DURATION = 2;

type GameStep = "game" | "camera" | "proposal";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<GameStep>("game");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleShowCamera = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("camera");
      setIsTransitioning(false);
    }, ANIM_DURATION * 1000);
  };

  const handleShowProposal = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("proposal");
      setIsTransitioning(false);
    }, ANIM_DURATION * 1000);
  };

  return (
    <OrientationGuard>
      <main className="flex items-center justify-center min-h-screen bg-black overflow-hidden relative">
        {currentStep === "game" && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            transition={{ duration: ANIM_DURATION }}
            className="flex flex-col items-center"
          >
            <PhotoPairGame handleShowProposal={handleShowCamera} />
            <div className="mt-4 md:mt-0">
              <TextFooter />
            </div>
          </motion.div>
        )}
        
        {currentStep === "camera" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            transition={{ duration: ANIM_DURATION }}
            className="w-full h-full"
          >
            <HeartCameraPage onComplete={handleShowProposal} />
          </motion.div>
        )}

        {currentStep === "proposal" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: ANIM_DURATION }}
          >
            <ValentinesProposal />
          </motion.div>
        )}
        
        {/* Music Player - available on all pages */}
        <MusicPlayer />
      </main>
    </OrientationGuard>
  );
}
