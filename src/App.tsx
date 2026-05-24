import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/components/layout/HomePage'
import { NotificationStack } from '@/components/ui/NotificationStack'

// Tool imports
import { CompressImageTool } from '@/components/tools/image/CompressImage'
import { MergePdfTool }      from '@/components/tools/pdf/MergePdf'
import {
  ResizeImageTool,
  ConvertImageTool,
  CropImageTool,
  SplitPdfTool,
  ReorderPdfTool,
  CompressPdfTool,
} from '@/components/tools/stubs'

export function App() {
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/"                element={<HomePage />} />

          {/* Image tools */}
          <Route path="/image/compress"  element={<CompressImageTool />} />
          <Route path="/image/resize"    element={<ResizeImageTool />} />
          <Route path="/image/convert"   element={<ConvertImageTool />} />
          <Route path="/image/crop"      element={<CropImageTool />} />

          {/* PDF tools */}
          <Route path="/pdf/merge"       element={<MergePdfTool />} />
          <Route path="/pdf/split"       element={<SplitPdfTool />} />
          <Route path="/pdf/reorder"     element={<ReorderPdfTool />} />
          <Route path="/pdf/compress"    element={<CompressPdfTool />} />

          {/* Fallback */}
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>

      {/* Toast notifications – outside layout so they always float */}
      <NotificationStack />
    </>
  )
}
