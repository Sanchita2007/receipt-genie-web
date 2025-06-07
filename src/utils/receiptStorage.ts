// src/utils/receiptStorage.ts

// This will store the uploaded template for processing
let uploadedTemplateFile: File | null = null;

export const setTemplate = (template: File | null) => {
  uploadedTemplateFile = template;
  if (template) {
    console.log('Template set in receiptStorage:', template.name);
  } else {
    console.log('Template cleared in receiptStorage.');
  }
};

export const getTemplate = (): File | null => {
  return uploadedTemplateFile;
};

// All HTML/PDF generation and download functions are removed as per request.
// Functions like generateReceiptHTML, downloadReceiptAsPDFFromHTML, downloadReceiptAsHTML
// are no longer needed if the primary output is DOCX managed via Supabase.