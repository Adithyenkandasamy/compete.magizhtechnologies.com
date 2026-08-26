export default function AdminUsers() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Users</h1>
        <p className="text-muted mt-2">Search, review, and manage platform access.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search users..."
          className="px-4 py-2 bg-card border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary"
        />
        <select className="px-4 py-2 bg-card border border-border rounded-lg text-text focus:outline-none focus:border-primary">
          <option>All Roles</option>
          <option>Student</option>
          <option>Organizer</option>
          <option>Admin</option>
          <option>Super Admin</option>
        </select>
        <select className="px-4 py-2 bg-card border border-border rounded-lg text-text focus:outline-none focus:border-primary">
          <option>All Status</option>
          <option>Active</option>
          <option>Suspended</option>
          <option>Verified</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((index) => (
              <tr key={index} className="border-b border-border hover:bg-surface transition">
                <td className="px-6 py-4 text-text">Student {index}</td>
                <td className="px-6 py-4 text-muted">student{index}@comp.dev</td>
                <td className="px-6 py-4 text-muted">Student</td>
                <td className="px-6 py-4 text-success">Active</td>
                <td className="px-6 py-4 space-x-3 text-sm">
                  <button className="text-primary hover:text-accent transition">View</button>
                  <button className="text-warning hover:text-warning/80 transition">Role</button>
                  <button className="text-danger hover:text-danger/80 transition">Suspend</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}