import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver'; // For downloading

export interface WordTemplateProcessorOptions {
  templateFile: File;
  studentData: any; // This is the 'context' object from AdminDashboard
  studentName: string;
  enrollmentNo: string; // Needed for filename
}

// Helper function to load a file as ArrayBuffer
const loadFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        resolve(event.target.result as ArrayBuffer);
      } else {
        reject(new Error('Failed to read file.'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
};

export const processAndDownloadWordTemplateWithDocxtemplater = async (
  options: WordTemplateProcessorOptions
): Promise<void> => {
  const { templateFile, studentData, studentName, enrollmentNo } = options;

  try {
    console.log('Loading template file for docxtemplater...');
    const content = await loadFileAsArrayBuffer(templateFile);
    console.log('Template file loaded.');

    const zip = new PizZip(content);
    console.log('PizZip instance created.');
    
    // Crucial: Set delimiters to match your template {{placeholder}}
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true, // Handles \n in data -> <w:br/> in Word
        delimiters: {
            start: '{{',
            end: '}}',
        },
    });
    console.log('Docxtemplater instance created with custom delimiters.');

    console.log('Setting template data:', studentData);
    doc.setData(studentData);

    try {
      console.log('Rendering document...');
      doc.render(); // Render the document (replace placeholders)
      console.log('Document rendered.');
    } catch (renderError: any) {
      console.error('Error rendering document with docxtemplater:', renderError);
      // Log detailed errors if available (often in renderError.properties.errors)
      if (renderError.properties && renderError.properties.errors) {
        renderError.properties.errors.forEach((err: any) => {
          console.error('Detailed render error:', err.stack || err);
        });
      }
      throw new Error(`Docxtemplater render error: ${renderError.message || String(renderError)}`);
    }

    console.log('Generating output blob...');
    const outBlob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    console.log('Output blob generated.');

    // Use file-saver to trigger download
    const filename = `Receipt_${studentName.replace(/\s+/g, '_')}_${enrollmentNo}.docx`;
    saveAs(outBlob, filename);
    console.log(`File ${filename} download triggered.`);

  } catch (error) {
    console.error(`Error in processAndDownloadWordTemplateWithDocxtemplater for ${studentName}:`, error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    // Re-throw the error so it can be caught by the calling function (e.g., in AdminDashboard)
    // and potentially shown to the user via a toast.
    throw new Error(`Failed to process Word template: ${errorMessage}`);
  }
};