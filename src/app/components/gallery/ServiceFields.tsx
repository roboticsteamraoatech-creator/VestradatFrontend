import React from 'react';
import { FormData } from '@/types/gallery';

interface ServiceFieldsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ServiceFields: React.FC<ServiceFieldsProps> = ({ 
  formData, 
  setFormData, 
  errors 
}) => {
  return (
    <>
      {/* Service Provider Fields - Total Service Providers only */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Service Providers <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.totalAvailableServiceProviders || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, totalAvailableServiceProviders: e.target.value ? Number(e.target.value) : 1 }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            errors.totalAvailableServiceProviders ? 'border-red-500' : 'border-gray-300'
          }`}
          min="1"
          placeholder="1"
        />
        {errors.totalAvailableServiceProviders && (
          <p className="mt-1 text-sm text-red-600">{errors.totalAvailableServiceProviders}</p>
        )}
      </div>

      {/* Quantity field for services */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <input
          type="number"
          value={formData.totalAvailableQuantity || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, totalAvailableQuantity: e.target.value ? Number(e.target.value) : 0 }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          min="0"
          placeholder="0"
        />
      </div>

      {/* Sub-Services Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-gray-700">
            Has Sub-Services
          </label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ 
              ...prev, 
              hasSubServices: !prev.hasSubServices,
              subServices: !prev.hasSubServices ? [] : prev.subServices
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.hasSubServices ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.hasSubServices ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {formData.hasSubServices && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Sub-Services</h4>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  subServices: [...prev.subServices, { name: '', description: '', price: 0, uploadPicture: '' }]
                }))}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Sub-Service
              </button>
            </div>
            {errors.subServices && (
              <p className="text-sm text-red-600">{errors.subServices}</p>
            )}
            
            {formData.subServices.map((subService, index) => (
              <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-800">Sub-Service {index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      subServices: prev.subServices.filter((_, i) => i !== index)
                    }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subService.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        subServices: prev.subServices.map((s, i) => 
                          i === index ? { ...s, name: e.target.value } : s
                        )
                      }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                        errors[`subService_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Sub-service name"
                    />
                    {errors[`subService_${index}_name`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`subService_${index}_name`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={subService.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        subServices: prev.subServices.map((s, i) => 
                          i === index ? { ...s, description: e.target.value } : s
                        )
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                      placeholder="Sub-service description"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={subService.price || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        subServices: prev.subServices.map((s, i) => 
                          i === index ? { ...s, price: e.target.value ? Number(e.target.value) : 0 } : s
                        )
                      }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                        errors[`subService_${index}_price`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="0"
                      placeholder="0"
                    />
                    {errors[`subService_${index}_price`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`subService_${index}_price`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Image (optional)
                    </label>
                    {(subService.previewUrl || subService.uploadPicture) ? (
                      <div className="relative inline-block">
                        <img
                          src={subService.previewUrl || subService.uploadPicture}
                          alt="Sub-service preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (subService.previewUrl) URL.revokeObjectURL(subService.previewUrl);
                            setFormData(prev => ({
                              ...prev,
                              subServices: prev.subServices.map((s, i) =>
                                i === index ? { ...s, file: undefined, previewUrl: undefined, uploadPicture: undefined } : s
                              )
                            }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500">Upload image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const previewUrl = URL.createObjectURL(file);
                            setFormData(prev => ({
                              ...prev,
                              subServices: prev.subServices.map((s, i) =>
                                i === index ? { ...s, file, previewUrl } : s
                              )
                            }));
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {formData.subServices.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No sub-services added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Booking Availability Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-4">Booking Availability</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Days Available
          </label>
          <div className="space-y-2">
            {formData.bookingAvailability.daysAvailable.map((day, index) => (
              <div key={index} className="flex items-center gap-3 bg-white p-2 rounded">
                <input
                  type="checkbox"
                  checked={day.isAvailable}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bookingAvailability: {
                      ...prev.bookingAvailability,
                      daysAvailable: prev.bookingAvailability.daysAvailable.map((d, i) =>
                        i === index ? { ...d, isAvailable: e.target.checked } : d
                      )
                    }
                  }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 w-24">{DAY_NAMES[day.dayOfWeek]}</span>
                {day.isAvailable && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={day.timeWindows[0]?.startTime || '09:00'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bookingAvailability: {
                          ...prev.bookingAvailability,
                          daysAvailable: prev.bookingAvailability.daysAvailable.map((d, i) =>
                            i === index ? { ...d, timeWindows: [{ ...d.timeWindows[0], startTime: e.target.value }] } : d
                          )
                        }
                      }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={day.timeWindows[0]?.endTime || '17:00'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bookingAvailability: {
                          ...prev.bookingAvailability,
                          daysAvailable: prev.bookingAvailability.daysAvailable.map((d, i) =>
                            i === index ? { ...d, timeWindows: [{ ...d.timeWindows[0], endTime: e.target.value }] } : d
                          )
                        }
                      }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Slot Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.bookingAvailability.slotDurationMinutes || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              bookingAvailability: {
                ...prev.bookingAvailability,
                slotDurationMinutes: e.target.value ? Number(e.target.value) : 60
              }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            min="15"
            max="480"
            placeholder="60"
          />
          <p className="text-xs text-blue-600 mt-1">15-480 minutes per booking slot</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Concurrent Providers
          </label>
          <input
            type="number"
            value={formData.bookingAvailability.concurrentProviders || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              bookingAvailability: {
                ...prev.bookingAvailability,
                concurrentProviders: e.target.value ? Number(e.target.value) : 1
              }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            min="1"
            max="100"
            placeholder="1"
          />
          <p className="text-xs text-blue-600 mt-1">How many providers can book the same slot (1-100)</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Availability Period Type
          </label>
          <select
            value={formData.bookingAvailability.availabilityPeriod.type}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              bookingAvailability: {
                ...prev.bookingAvailability,
                availabilityPeriod: {
                  type: e.target.value as 'unlimited' | 'dateRange' | 'rollingWeeks',
                  weeksAhead: e.target.value === 'rollingWeeks' ? 6 : undefined,
                  startDate: e.target.value === 'dateRange' ? prev.startDate : undefined,
                  endDate: e.target.value === 'dateRange' ? prev.endDate : undefined
                }
              }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="unlimited">Unlimited</option>
            <option value="dateRange">Date Range</option>
            <option value="rollingWeeks">Rolling Weeks</option>
          </select>
        </div>

        {formData.bookingAvailability.availabilityPeriod.type === 'rollingWeeks' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Weeks Ahead
            </label>
            <input
              type="number"
              value={formData.bookingAvailability.availabilityPeriod.weeksAhead || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                bookingAvailability: {
                  ...prev.bookingAvailability,
                  availabilityPeriod: {
                    ...prev.bookingAvailability.availabilityPeriod,
                    weeksAhead: e.target.value ? Number(e.target.value) : 6
                  }
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              min="1"
              max="52"
              placeholder="6"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Timezone
          </label>
          <input
            type="text"
            value={formData.bookingAvailability.timezone}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              bookingAvailability: {
                ...prev.bookingAvailability,
                timezone: e.target.value
              }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Africa/Lagos"
          />
        </div>
      </div>
    </>
  );
};

export default ServiceFields;
