// This will be available globally from the script tag in index.html
declare const jspdf: any;

import type { Patient, Reminder, Medication, MedicalRecord, Doctor } from '../types';
import { summarizeMedicalHistory } from './geminiService';

const MARGIN = 15;
const PAGE_WIDTH = 210;
const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_HEADER = 16;
const FONT_SIZE_SUBHEADER = 12;
const LINE_HEIGHT = 5;

let doc: any;
let yPos: number;

// Helper to check for page break and add footer
function checkPageBreak(requiredHeight: number = 20): void {
    if (yPos > 297 - MARGIN - requiredHeight) { // A4 height is 297mm
        doc.addPage();
        yPos = MARGIN;
    }
}

// Helper for adding section headers
function addSectionHeader(title: string): void {
    checkPageBreak(20);
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_HEADER);
    doc.setTextColor(31, 41, 55); // text-light dark
    doc.text(title, MARGIN, yPos);
    yPos += 3;
    doc.setDrawColor(229, 231, 235); // border-light
    doc.line(MARGIN, yPos, MARGIN + MAX_WIDTH, yPos);
    yPos += 8;
}

// Helper to add text with wrapping
function addWrappedText(text: string | string[], options: { x?: number, y?: number, maxWidth?: number, isBold?: boolean, fontSize?: number, color?: number[] } = {}): void {
    const { x = MARGIN, y = yPos, maxWidth = MAX_WIDTH, isBold = false, fontSize = FONT_SIZE_NORMAL, color = [107, 114, 128] } = options;
    
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    yPos = y + (lines.length * LINE_HEIGHT);
}

// Helper for key-value pair
function addDetail(key: string, value: string | undefined): void {
    if (!value || value.trim() === '') return;

    checkPageBreak(10);
    
    const keyX = MARGIN + 4;
    const valueX = MARGIN + 35;
    const valueMaxWidth = MAX_WIDTH - (valueX - MARGIN) - 4;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setTextColor(31, 41, 55);
    doc.text(`${key}:`, keyX, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    const lines = doc.splitTextToSize(value, valueMaxWidth);
    doc.text(lines, valueX, yPos);
    
    yPos += (lines.length * LINE_HEIGHT) + 2;
}


// Adds Current Medications section
function addMedicationsSection(meds: Medication[]): void {
    addSectionHeader('Current Medications');
    
    if (meds.length === 0) {
        addWrappedText("No current medications listed.");
        return;
    }

    meds.forEach(med => {
        checkPageBreak(40);
        const startY = yPos;
        
        // Medication Name and Strength
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONT_SIZE_SUBHEADER);
        doc.setTextColor(31, 41, 55);
        let nameText = med.name;
        if (med.strength) {
            nameText += ` (${med.strength})`;
        }
        doc.text(nameText, MARGIN, yPos);
        yPos += 6;

        addDetail("Dosage", `${med.dosage}, ${med.frequency}`);
        addDetail("Prescribed By", med.prescribedBy);
        addDetail("Start Date", med.startDate);
        addDetail("Notes", med.notes);
        
        yPos += 2;
        doc.setDrawColor(243, 244, 246); // Lighter gray for inner lines
        doc.line(MARGIN, yPos, MARGIN + MAX_WIDTH, yPos);
        yPos += 5;
    });
}

// Adds Reminders section
function addRemindersSection(reminders: Reminder[]): void {
    addSectionHeader('Reminders');

    if (reminders.length === 0) {
        addWrappedText("No reminders set.");
        return;
    }

    // Categorize reminders
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const categorized = {
        overdue: [] as Reminder[],
        today: [] as Reminder[],
        upcoming: [] as Reminder[],
        completed: [] as Reminder[],
    };

    const getEffectiveDate = (r: Reminder) => r.dueDate || r.date;

    reminders.forEach(r => {
        if (r.completed) {
            categorized.completed.push(r);
            return;
        }
        const effectiveDateStr = getEffectiveDate(r);
        const [year, month, day] = effectiveDateStr.split('-').map(Number);
        const reminderDate = new Date(year, month - 1, day);

        if (reminderDate < now) categorized.overdue.push(r);
        else if (effectiveDateStr === todayStr) categorized.today.push(r);
        else categorized.upcoming.push(r);
    });

    const renderGroup = (title: string, group: Reminder[]) => {
        if (group.length === 0) return;
        checkPageBreak(15);
        yPos += 5;
        addWrappedText(title, { isBold: true, fontSize: FONT_SIZE_SUBHEADER, color: [31, 41, 55] });
        yPos += 2;
        
        group.sort((a, b) => new Date(getEffectiveDate(a)).getTime() - new Date(getEffectiveDate(b)).getTime())
             .forEach(r => {
                checkPageBreak(10);
                const status = r.completed ? '[✓]' : '[ ]';
                const date = new Date(`${getEffectiveDate(r)}T${r.time}`);
                const dateString = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                addWrappedText(`${status} ${r.title} (${r.type}) - Due: ${dateString} at ${r.time}`, { x: MARGIN + 4 });
        });
    }
    
    renderGroup('Overdue', categorized.overdue);
    renderGroup('Today', categorized.today);
    renderGroup('Upcoming', categorized.upcoming);
    renderGroup('Completed', categorized.completed);
}

// Adds Medical Records section
async function addRecordsSection(records: MedicalRecord[], doctors: Doctor[]): Promise<void> {
    addSectionHeader('Medical Records');
    
    if (records.length === 0) {
        addWrappedText("No records available for this person.");
        return;
    }

    for (const record of records) {
        checkPageBreak(50); // Min height for a record
        const startY = yPos;
        
        // Record Box
        yPos += 2;
        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(249, 250, 251); // background-light
        doc.roundedRect(MARGIN, startY, MAX_WIDTH, 1, 3, 3, 'F'); // Placeholder for height

        // Header
        const doctorName = doctors.find(d => d.id === record.doctorId)?.name || 'Unknown Doctor';
        addWrappedText(`Visit on ${record.date} with ${doctorName}`, { x: MARGIN + 4, y: startY + 6, isBold: true, fontSize: FONT_SIZE_SUBHEADER, color: [31, 41, 55] });
        yPos += 8;

        addDetail('Complaint', record.complaint);
        addDetail('Investigations', record.investigations);
        addDetail('Diagnosis', record.diagnosis);
        addDetail('Prescription', record.prescription);
        addDetail('Notes', record.notes);

        if (record.documents.length > 0) {
            yPos += 2;
            addWrappedText('Attached Documents:', { x: MARGIN + 4, isBold: true, color: [31, 41, 55] });
            yPos += 2;

            for (const document of record.documents) {
                 checkPageBreak(10);
                if (document.type === 'image' && document.url.startsWith('data:image')) {
                    try {
                        const img = new Image();
                        img.src = document.url;
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                        });
                        const imgProps = doc.getImageProperties(document.url);
                        const aspectRatio = imgProps.width / imgProps.height;
                        const imgWidth = Math.min(80, MAX_WIDTH - 8);
                        const imgHeight = imgWidth / aspectRatio;
                        
                        checkPageBreak(imgHeight + 10);
                        addWrappedText(`- ${document.name}`, { x: MARGIN + 8 });
                        doc.addImage(document.url, imgProps.fileType, MARGIN + 8, yPos, imgWidth, imgHeight);
                        yPos += imgHeight + 5;

                    } catch (e) {
                        console.error("Error adding image to PDF:", e);
                        addWrappedText(`- ${document.name} (Could not embed image)`, { x: MARGIN + 8 });
                    }
                } else {
                    addWrappedText(`- ${document.name} (${document.type})`, { x: MARGIN + 8 });
                }
            }
        }
        
        // Draw the final box
        const boxHeight = yPos - startY + 4;
        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(MARGIN, startY, MAX_WIDTH, boxHeight, 3, 3, 'FD');
        yPos += 6;
    }
}

// Add page numbers
function addPageNumbers() {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH / 2, 297 - 10, { align: 'center' });
    }
}


export const generatePatientPdf = async (patient: Patient, doctors: Doctor[]) => {
    const { jsPDF } = jspdf;
    doc = new jsPDF({ unit: 'mm', format: 'a4' });
    yPos = MARGIN;

    // --- 1. HEADER ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`Health Record for ${patient.name}`, MARGIN, yPos);
    yPos += 8;
    const primaryDoctorName = doctors.find(d => d.id === patient.primaryDoctorId)?.name;
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // subtle-light
    if (primaryDoctorName) {
        doc.text(`Primary Doctor: ${primaryDoctorName}`, MARGIN, yPos);
        yPos += 5;
    }
    const hospitalIdText = (patient.hospitalIds && patient.hospitalIds.length > 0)
        ? patient.hospitalIds.map(hid => `${hid.hospitalName}: ${hid.patientId}`).join(' | ')
        : 'N/A';
    doc.text(`Hospital IDs: ${hospitalIdText}`, MARGIN, yPos);
    yPos += 5;

    // --- 2. AI SUMMARY ---
    const summary = await summarizeMedicalHistory(patient);
    addSectionHeader('Medical History Summary (AI-Generated)');
    addWrappedText(summary, { y: yPos });
    yPos += 5;

    // --- 3. MEDICATIONS ---
    addMedicationsSection(patient.currentMedications || []);
    yPos += 5;

    // --- 4. REMINDERS ---
    addRemindersSection(patient.reminders || []);
    yPos += 5;
    
    // --- 5. RECORDS ---
    await addRecordsSection(patient.records || [], doctors);
    
    // --- 6. FOOTER ---
    addPageNumbers();

    doc.save(`${patient.name.replace(/\s+/g, '_')}_health_record.pdf`);
};