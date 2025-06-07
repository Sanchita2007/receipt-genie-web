// src/utils/wordTemplateProcessor.ts
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
// Remove: import { saveAs } from 'file-saver';

export interface WordTemplateProcessorOptions {
  templateFile: File;
  studentData: any; // This is the 'context' object from AdminDashboard
  // studentName and enrollmentNo are not needed here if not used for filename generation inside this func
}

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

export const processWordTemplate = async (
  options: WordTemplateProcessorOptions
): Promise<Blob> => { // Changed return type
  const { templateFile, studentData } = options;

  try {
    console.log('Loading template file for docxtemplater...');
    const content = await loadFileAsArrayBuffer(templateFile);
    console.log('Template file loaded.');

    const zip = new PizZip(content);
    console.log('PizZip instance created.');
    
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
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
      doc.render();
      console.log('Document rendered.');
    } catch (renderError: any) {
      console.error('Error rendering document with docxtemplater:', renderError);
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

    return outBlob; // Return the blob

  } catch (error) {
    console.error(`Error in processWordTemplate:`, error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    throw new Error(`Failed to process Word template: ${errorMessage}`);
  }
};