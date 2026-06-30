export default function SellerMessagesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">💬 ข้อความจากลูกค้า</h1>
        <p className="text-neutral-600 mt-1">ตอบสนองต่อข้อความและคำถามจากลูกค้า</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'ข้อความที่ยังไม่อ่าน', value: 3, icon: '🔴', color: 'bg-red-50 border-red-200' },
            { label: 'ทั้งหมด', value: 24, icon: '💬', color: 'bg-blue-50 border-blue-200' },
            { label: 'เวลาตอบสนองเฉลี่ย', value: '2ชม', icon: '⏱️', color: 'bg-purple-50 border-purple-200' },
            { label: 'อัตราการตอบสนอง', value: '95%', icon: '✓', color: 'bg-green-50 border-green-200' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-lg border p-4 ${stat.color}`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-sm text-neutral-600">{stat.label}</div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="text-center py-12 text-neutral-500">
          <div className="text-4xl mb-3">💌</div>
          <p>หน้านี้อยู่ระหว่างการพัฒนา</p>
          <p className="text-sm mt-2">ระบบข้อความจะพร้อมใช้งานเร็วๆ นี้</p>
        </div>
      </div>
    </div>
  );
}
