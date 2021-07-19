import { RenderingEngine } from '@ohif/cornerstone-render'
import triggerAnnotationRender from './triggerAnnotationRender'

export function triggerAnnotationRenderForViewportUIDs(
  renderingEngine: RenderingEngine,
  viewportUIDsToRender: string[]
): void {
  viewportUIDsToRender.forEach((viewportUID) => {
    const elem = renderingEngine.getViewport(viewportUID).canvas
    triggerAnnotationRender(elem)
  })
}

export default triggerAnnotationRenderForViewportUIDs