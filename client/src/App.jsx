
import { useState } from 'react';
import './App.css';

const FORMS_A = ["WR-1", "WR-2", "WR-3", "WR-4", "WR-5", "WR-6", "WR-7", "WR-8", "WR-9", "WR-10", "WR-11"];
const FORMS_B = ["WR-12", "WR-13", "WR-14", "WR-15", "WR-16", "WR-17", "WR-18", "WR-19", "WR-20", "WR-21", "WR-22"];

function App() {
  const [step, setStep] = useState(0);
  const [idImage, setIdImage] = useState(null);
  const [ocrData, setOcrData] = useState({ Name: '', DOB: '', Address: '' });
  const [clientType, setClientType] = useState('');
  const [formData, setFormData] = useState({});


  // Real OCR API call
  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    setIdImage(file);
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/functions/ocr', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      if (!res.ok) throw new Error('OCR failed');
      const data = await res.json();
      setOcrData(data);
      setStep(1);
    } catch (err) {
      alert('OCR failed. Please try again.');
      setIdImage(null);
    }
  };

  const handleClientType = (type) => {
    setClientType(type);
    setStep(2);
  };

  const handleFormChange = (form, value) => {
    setFormData((prev) => ({ ...prev, [form]: value }));
  };

  const handleSubmit = () => {
    alert('Onboarding Complete!');
    // TODO: Submit all data to backend
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Tenant Onboarding Wizard</h1>
        {step === 0 && (
          <div className="flex flex-col items-center">
            <label className="mb-2 font-semibold">Upload ID for OCR</label>
            <input type="file" accept="image/*" onChange={handleIdUpload} className="mb-4" />
            {idImage && <p>Processing...</p>}
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="font-semibold mb-2">Auto-filled Details</h2>
            <div className="mb-4">
              <div><b>Name:</b> {ocrData.Name}</div>
              <div><b>DOB:</b> {ocrData.DOB}</div>
              <div><b>Address:</b> {ocrData.Address}</div>
            </div>
            <label className="block mb-2">Select Client Type:</label>
            <div className="flex gap-4 mb-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => handleClientType('A')}>Client Type A</button>
              <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={() => handleClientType('B')}>Client Type B</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="font-semibold mb-2">Required Forms</h2>
            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
              {(clientType === 'A' ? FORMS_A : FORMS_B).map(form => (
                <div key={form} className="mb-3">
                  <label className="block mb-1">{form} Signature:</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1"
                    value={formData[form] || ''}
                    onChange={e => handleFormChange(form, e.target.value)}
                    placeholder={`Enter signature for ${form}`}
                  />
                </div>
              ))}
              <button type="submit" className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded">Submit</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
