// src/components/ProjectHeader.jsx
import React, { useState } from 'react';

const ProjectHeader = ({ projectId, createTask }) => {
  const [title, setTitle] = useState('');

  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    createTask(title); // ✅ use the passed-in function from KanbanBoard
    setTitle('');
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">Project ID: {projectId}</h2>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          className="border px-3 py-1 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add new task"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          Add
        </button>
      </form>
    </div>
  );
};

export default ProjectHeader;
