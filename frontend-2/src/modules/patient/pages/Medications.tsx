import React, { useState } from 'react';
import { CheckCircle2, Circle, PlusCircle, Pill } from 'lucide-react';

interface Medication {
  id: number;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

const Medications = () => {
  const [meds, setMeds] = useState<Medication[]>([
    { id: 1, name: 'Lisinopril', dosage: '10mg', time: '08:00 AM', taken: true },
    { id: 2, name: 'Donepezil', dosage: '5mg', time: '02:00 PM', taken: false },
    { id: 3, name: 'Metformin', dosage: '500mg', time: '08:00 PM', taken: false },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '' });

  const toggleTaken = (id: number) => {
    setMeds(meds.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const handleAdd = () => {
    if (newMed.name && newMed.dosage && newMed.time) {
      setMeds([...meds, { ...newMed, id: Date.now(), taken: false }]);
      setNewMed({ name: '', dosage: '', time: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-(--color-navy)">Medication Schedule</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-(--color-sage) text-white px-6 py-3 rounded-2xl text-xl font-bold hover:bg-[#6b8c84] transition-colors shadow-sm"
        >
          <PlusCircle className="w-6 h-6" />
          Add Medication
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-(--color-ivory-200) mb-6 fade-in">
          <h3 className="text-2xl font-bold text-(--color-navy) mb-4">New Medication</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input 
              type="text" 
              placeholder="Name (e.g. Aspirin)" 
              value={newMed.name}
              onChange={e => setNewMed({...newMed, name: e.target.value})}
              className="p-3 border rounded-xl"
            />
            <input 
              type="text" 
              placeholder="Dosage (e.g. 50mg)" 
              value={newMed.dosage}
              onChange={e => setNewMed({...newMed, dosage: e.target.value})}
              className="p-3 border rounded-xl"
            />
            <input 
              type="time" 
              value={newMed.time}
              onChange={e => setNewMed({...newMed, time: e.target.value})}
              className="p-3 border rounded-xl"
            />
          </div>
          <div className="flex gap-4 justify-end">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-(--color-navy) font-bold">Cancel</button>
            <button onClick={handleAdd} className="px-6 py-2 bg-(--color-sage) text-white font-bold rounded-xl">Save</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-(--color-ivory-200)">
        <div className="space-y-4">
          {meds.map(med => (
            <div 
              key={med.id} 
              className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                med.taken ? 'bg-(--color-ivory-100) border-(--color-ivory-200)' : 'bg-white border-(--color-sage)/30 hover:border-(--color-sage)'
              }`}
              onClick={() => toggleTaken(med.id)}
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-xl ${med.taken ? 'bg-(--color-ivory-200) text-(--color-navy)' : 'bg-(--color-sage)/10 text-(--color-sage)'}`}>
                  <Pill className="w-8 h-8" />
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${med.taken ? 'text-(--color-navy)/50 line-through' : 'text-(--color-navy)'}`}>
                    {med.name}
                  </h3>
                  <p className="text-lg text-(--color-navy)/70">{med.dosage} • {med.time}</p>
                </div>
              </div>
              
              <button className="p-2">
                {med.taken ? (
                  <CheckCircle2 className="w-10 h-10 text-(--color-sage)" />
                ) : (
                  <Circle className="w-10 h-10 text-(--color-ivory-200) hover:text-(--color-sage) transition-colors" />
                )}
              </button>
            </div>
          ))}
          {meds.length === 0 && <p className="text-center text-(--color-navy)/50">No medications scheduled.</p>}
        </div>
      </div>
    </div>
  );
};

export default Medications;
