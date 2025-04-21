/* eslint-disable prefer-const */
import { UseEvaluationPollingProps } from "@/types/types";
import { useEffect, useState } from "react";

export const useEvaluationPolling = ({
  jobId,
  onSuccess,
  onError,
  retryCount = 1
}: UseEvaluationPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentRetry, setCurrentRetry] = useState(0);

  useEffect(() => {
    if (!jobId) return;

    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/evaluate/status?jobId=${jobId}`);
        
        if (!mounted) return;
        
        if (response.status === 404) {
          if (currentRetry < retryCount) {
            setCurrentRetry(prev => prev + 1);
          } else {
            onError('Job not found');
            setIsPolling(false);
            clearInterval(intervalId);
          }
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          onSuccess(data.result);
          setIsPolling(false);
          clearInterval(intervalId);
        } else if (data.status === 'failed') {
          onError(data.error || 'Evaluation failed');
          setIsPolling(false);
          clearInterval(intervalId);
        }
        // If status is still 'processing', continue polling
      } catch (error) {
        if (currentRetry < retryCount) {
          setCurrentRetry(prev => prev + 1);
        } else {
          onError(error instanceof Error ? error.message : 'Failed to fetch status');
          setIsPolling(false);
          clearInterval(intervalId);
        }
      }
    };

    setIsPolling(true);
    // Initial check
    checkStatus();
    // Set up polling interval (5 seconds)
    intervalId = setInterval(checkStatus, 5000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, onSuccess, onError, retryCount, currentRetry]);

  return { isPolling };
};
