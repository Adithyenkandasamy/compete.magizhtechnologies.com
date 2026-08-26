export default function AdminUsers() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">User Management</h1>
        <p className="text-muted mt-2">Manage all platform users and their permissions</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search users..."
          className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary"
        />
        <select className="px-4 py-2 bg-card border border-border rounded-lg text-text focus:outline-none focus:border-primary">
          <option>All Roles</option>
          <option>Student</option>
          <option>Organizer</option>
          <option>Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Joined</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border hover:bg-surface transition">
                <td className="px-6 py-4 text-text">User {i}</td>
                <td className="px-6 py-4 text-muted">user{i}@example.com</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                    Student
                  </span>
                </td>
                <td className="px-6 py-4 text-muted text-sm">Dec 1, 2026</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-primary hover:text-accent transition text-sm">View</button>
                    <button className="text-danger hover:text-danger/80 transition text-sm">Suspend</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
