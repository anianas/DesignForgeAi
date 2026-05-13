'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastContext';

/**
 * Polls GET /api/project/:projectId every 1.5 s until the concept generation
 * completes, fails, or throws. Redirects to /project/:projectId on success.
 */
export function useGenerationPolling(projectId) {
  const router = useRouter();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing…');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { project, jobProgress } = await api.getProject(projectId);
        setProject(project);
        if (jobProgress) {
          setProgress(jobProgress.progress);
          setCurrentStep(jobProgress.currentStep);
          setCompletedSteps(jobProgress.steps || []);
        }
        if (project.status === 'concept-ready' || project.status === 'complete') {
          clearInterval(intervalRef.current);
          setProgress(100);
          setTimeout(() => router.push(`/project/${projectId}`), 600);
        } else if (project.status === 'failed') {
          clearInterval(intervalRef.current);
          setError('Generation failed. Error code: GEN_500');
          toast.show('Generation failed. Please try again.', 'error');
        }
      } catch (err) {
        clearInterval(intervalRef.current);
        setError(err.message);
      }
    };

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 1500);
    return () => clearInterval(intervalRef.current);
  }, [projectId, router, toast]);

  return { project, progress, currentStep, completedSteps, error };
}
