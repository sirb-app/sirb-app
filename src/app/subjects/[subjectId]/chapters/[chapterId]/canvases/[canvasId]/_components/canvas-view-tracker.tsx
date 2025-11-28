"use client";

import { markCanvasComplete } from "@/actions/canvas-progress.action";
import { trackCanvasView } from "@/actions/canvas-view.action";
import { useEffect, useRef } from "react";

type CanvasViewTrackerProps = {
  readonly canvasId: number;
  readonly isApproved: boolean;
};

export default function CanvasViewTracker({
  canvasId,
  isApproved,
}: CanvasViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (hasTracked.current || !isApproved) return;
    hasTracked.current = true;

    // Track view and mark as complete when user actually views the page
    const trackView = async () => {
      try {
        await Promise.all([
          markCanvasComplete(canvasId),
          trackCanvasView(canvasId),
        ]);
      } catch (error) {
        console.error("Error tracking canvas view:", error);
      }
    };

    trackView();
  }, [canvasId, isApproved]);

  return null;
}
