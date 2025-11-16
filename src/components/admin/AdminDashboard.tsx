import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Train } from '../../types';
import { mockTrains } from '../../data/mockData';

export const AdminDashboard = () => {
  const [trains, setTrains] = useState<Train[]>(mockTrains);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrain, setEditingTrain] = useState<Train | null>(null);
  const [formData, setFormData] = useState<Partial<Train>>({});

  const handleAddTrain = () => {
    setFormData({
      trainNumber: '',
      trainName: '',
      sourceStation: '',
      destinationStation: '',
      departureTime: '',
      arrivalTime: '',
      travelDuration: '',
      totalSeats: 100,
      availableSeats: 100,
      baseFare: 0,
      acAvailable: true,
      acFare: 0,
      daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      status: 'active',
    });
    setEditingTrain(null);
    setShowAddModal(true);
  };

  const handleEditTrain = (train: Train) => {
    setFormData(train);
    setEditingTrain(train);
    setShowAddModal(true);
  };

  const handleSaveTrain = () => {
    if (editingTrain) {
      setTrains(trains.map(t => t.id === editingTrain.id ? { ...formData as Train, id: editingTrain.id } : t));
    } else {
      const newTrain: Train = {
        ...formData as Train,
        id: Date.now().toString(),
      };
      setTrains([...trains, newTrain]);
    }
    setShowAddModal(false);
  };

  const handleDeleteTrain = (id: string) => {
    if (confirm('Are you sure you want to delete this train?')) {
      setTrains(trains.filter(t => t.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Train Management</h1>
          <p className="text-gray-600 mt-1">Add, update, and manage train schedules</p>
        </div>
        <button
          onClick={handleAddTrain}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Train
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Train Number</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Train Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Route</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Timing</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Seats</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fare</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trains.map((train) => (
                <tr key={train.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{train.trainNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{train.trainName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {train.sourceStation} → {train.destinationStation}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {train.departureTime} - {train.arrivalTime}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {train.availableSeats} / {train.totalSeats}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    ₹{train.baseFare}
                    {train.acAvailable && ` / ₹${train.acFare}`}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        train.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {train.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTrain(train)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrain(train.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingTrain ? 'Edit Train' : 'Add New Train'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Train Number</label>
                  <input
                    type="text"
                    value={formData.trainNumber || ''}
                    onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Train Name</label>
                  <input
                    type="text"
                    value={formData.trainName || ''}
                    onChange={(e) => setFormData({ ...formData, trainName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Express Train"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source Station</label>
                  <input
                    type="text"
                    value={formData.sourceStation || ''}
                    onChange={(e) => setFormData({ ...formData, sourceStation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination Station</label>
                  <input
                    type="text"
                    value={formData.destinationStation || ''}
                    onChange={(e) => setFormData({ ...formData, destinationStation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                  <input
                    type="time"
                    value={formData.departureTime || ''}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time</label>
                  <input
                    type="time"
                    value={formData.arrivalTime || ''}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={formData.travelDuration || ''}
                    onChange={(e) => setFormData({ ...formData, travelDuration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="6h 30m"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Seats</label>
                  <input
                    type="number"
                    value={formData.totalSeats || 0}
                    onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Seats</label>
                  <input
                    type="number"
                    value={formData.availableSeats || 0}
                    onChange={(e) => setFormData({ ...formData, availableSeats: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Fare</label>
                  <input
                    type="number"
                    value={formData.baseFare || 0}
                    onChange={(e) => setFormData({ ...formData, baseFare: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AC Available</label>
                  <select
                    value={formData.acAvailable ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, acAvailable: e.target.value === 'true' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AC Fare</label>
                  <input
                    type="number"
                    value={formData.acFare || 0}
                    onChange={(e) => setFormData({ ...formData, acFare: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.acAvailable}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTrain}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  {editingTrain ? 'Update Train' : 'Add Train'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
