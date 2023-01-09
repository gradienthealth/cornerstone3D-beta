import {
  StackViewport,
  Types,
  VolumeViewport,
  eventTarget,
  EVENTS,
  utilities as csUtils,
} from '@cornerstonejs/core';
import { ScrollOptions } from '../types';

/**
 * It scrolls one slice in the Stack or Volume Viewport, it uses the options provided
 * to determine the slice to scroll to. For Stack Viewport, it scrolls in the 1 or -1
 * direction, for Volume Viewport, it uses the camera and focal point to determine the
 * slice to scroll to based on the spacings.
 * @param viewport - The viewport in which to scroll
 * @param options - Options to use for scrolling, including direction, invert, and volumeId
 * @returns
 */
export default function scroll(
  viewport: Types.IStackViewport | Types.IVolumeViewport,
  options: ScrollOptions
): void {
  const { type: viewportType } = viewport;
  const { volumeId, delta } = options;

  if (viewport instanceof StackViewport) {
    viewport.scroll(delta, options.debounceLoading);
  } else if (viewport instanceof VolumeViewport) {
    scrollVolume(viewport, volumeId, delta);
  } else {
    throw new Error(`Not implemented for Viewport Type: ${viewportType}`);
  }
}

/**
 * _getDeltaFrameIndex is a subset of functionality copied from csUtils.snapFocalPointToSlice
 * @param delta
 * @param sliceRange
 * @param spacingInNormalDirection
 * @returns { int, int }
 */
function _getDeltaFrameIndex(delta, sliceRange, spacingInNormalDirection) {
  const { min, max, current } = sliceRange;
  const steps = Math.round((max - min) / spacingInNormalDirection);

  const fraction = (current - min) / (max - min);
  const floatingStepNumber = fraction * steps;
  let frameIndex = Math.round(floatingStepNumber);

  frameIndex += delta;

  return { frameIndex, steps };
}

export function scrollVolume(
  viewport: VolumeViewport,
  volumeId: string,
  delta: number
) {
  const camera = viewport.getCamera();
  const { focalPoint, viewPlaneNormal, position } = camera;
  const { spacingInNormalDirection, imageVolume } =
    csUtils.getTargetVolumeAndSpacingInNormalDir(viewport, camera, volumeId);

  if (!imageVolume) {
    throw new Error(
      `Could not find image volume with id ${volumeId} in the viewport`
    );
  }

  const actorEntry = viewport.getActor(imageVolume.volumeId);

  if (!actorEntry) {
    console.warn('No actor found for with actorUID of', imageVolume.volumeId);
  }

  const volumeActor = actorEntry.actor as Types.VolumeActor;
  const sliceRange = csUtils.getSliceRange(
    volumeActor,
    viewPlaneNormal,
    focalPoint
  );

  const { newFocalPoint, newPosition } = csUtils.snapFocalPointToSlice(
    focalPoint,
    position,
    sliceRange,
    viewPlaneNormal,
    spacingInNormalDirection,
    delta
  );

  viewport.setCamera({
    focalPoint: newFocalPoint,
    position: newPosition,
  });
  viewport.render();

  const { frameIndex, steps } = _getDeltaFrameIndex(
    delta,
    sliceRange,
    spacingInNormalDirection
  );

  if (frameIndex > steps || (frameIndex < 0 && viewport.getCurrentImageId())) {
    csUtils.triggerEvent(eventTarget, EVENTS.VOLUME_SCROLL_OUT_OF_BOUNDS, {
      volumeId: volumeId, // can we prefix this id for slab?
      viewport: viewport,
      delta: delta,
      desiredFrameIndex: frameIndex,
      currentImageId: viewport.getCurrentImageId(),
      currentFrameIndex: frameIndex - delta,
      maxFrames: steps,
    });
    // We listen for this event in the Volume Service.
    // some external handler deal with this event by calculating the correct volume.
    // this can be done by looking at the frameIndex which is over the total number
    // of imageIds.
    // also needs to check if this is in plane... (which can be checked via the viewport)
    // viewport.getCurrentImageId() is not null for in plane acquisition
    //
    // get the current image Id
    // map the currentImage id of the sub volume to our global volume
    // select the correct sub volume for the index of the currentImage id + delta

    // if our frameIndex is over the calculation is:
    // buffer_steps = (steps - frameIndex) or if under (just frameIndex)
    // true_delta = delta - buffer_steps -+ overlap volume
    // viewport.jumpToSlice(true_delta)
  }
}
