import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/utils/lib";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Spinner = ({ className }: { className?: string }) => (
    <div className={cn(" w-8 h-8 -mr-1 -mt-1 -ml-1", className)}>
        <DotLottieReact
            src="https://lottie.host/9ad4b7ee-0b2f-4868-8a48-f6de0bbbbd5c/uQwMnPP0AX.lottie"
            loop
            autoplay
            speed={0.5}
        />
    </div>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn("w-6 h-6", className)}
    >
        <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
        />
    </svg>
);

type LoadingState = {
    text: string;
    duration: number;  // Duration in milliseconds
};

const LoaderCore = ({
    loadingStates,
    value = 0,
}: {
    loadingStates: LoadingState[];
    value?: number;
}) => {
    return (
        <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-40">
            {loadingStates.map((loadingState, index) => {
                const distance = Math.abs(index - value);
                const opacity = Math.max(1 - distance * 0.2, 0);

                return (
                    <motion.div
                        key={index}
                        className={cn("text-left flex gap-2 mb-4")}
                        initial={{ opacity: 0, y: -(value * 40) }}
                        animate={{ opacity: opacity, y: -(value * 40) }}
                        transition={{ duration: 0.5 }}
                    >
                        <div>
                            {index === value ? (
                                <Spinner className="border-black border-t-transparent" />
                            ) : index < value ? (
                                <CheckIcon className="text-indigo-300" />
                            ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                            )}
                        </div>
                        <span
                            className={cn(
                                "text-black",
                                index === value && "text-black font-medium",
                                index < value && "text-indigo-300"
                            )}
                        >
                            {loadingState.text}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
};

export const MultiStepLoader = ({
    loadingStates,
    loading = true,
    loop = false,
}: {
    loadingStates: LoadingState[];
    loading?: boolean;
    loop?: boolean;
}) => {
    const [currentState, setCurrentState] = useState(0);

    useEffect(() => {
        if (!loading) {
            setCurrentState(0);
            return;
        }

        const timeout = setTimeout(() => {
            setCurrentState((prevState) => {
                if (loop) {
                    return prevState === loadingStates.length - 1 ? 0 : prevState + 1;
                }
                return Math.min(prevState + 1, loadingStates.length - 1);
            });
        }, loadingStates[currentState]?.duration || 2000);

        return () => clearTimeout(timeout);
    }, [currentState, loading, loop, loadingStates]);

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full fixed inset-0  flex items-center justify-center"
                >
                    <div className="h-96 relative">
                        <LoaderCore value={currentState} loadingStates={loadingStates} />
                    </div>
                    <div className="bg-gradient-to-t inset-x-0  bottom-0 bg-transparent h-full absolute [mask-image:radial-gradient(100px_at_center,transparent_100%,white)]" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MultiStepLoader;