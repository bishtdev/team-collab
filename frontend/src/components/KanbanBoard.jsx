// src/components/KanbanBoard.jsx
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../services/api';
import ProjectHeader from './ProjectHeader'; // 👈 ensure it's imported

const statuses = ['todo', 'in-progress', 'done'];

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    if (!projectId) return;
    try {
      const res = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const destStatus = result.destination.droppableId;

    try {
      await api.put(`/tasks/${taskId}`, { status: destStatus });
      fetchTasks();
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  };

  // ✅ Will be used in ProjectHeader to create a new task
  const createTask = async (title) => {
    try {
      const res = await api.post('/tasks', {
        title,
        status: 'todo',
        projectId,
      });
      setTasks((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Task creation failed', err);
    }
  };

  const grouped = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* ✅ Inject createTask into header */}
      <ProjectHeader projectId={projectId} createTask={createTask} />
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4">
          {statuses.map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 bg-gray-100 p-2 rounded"
                >
                  <h3 className="font-semibold mb-2">{status.toUpperCase()}</h3>
                  {grouped[status].map((task, idx) => (
                    <Draggable draggableId={task._id} index={idx} key={task._id}>
                      {(draggable) => (
                        <div
                          ref={draggable.innerRef}
                          {...draggable.dragHandleProps}
                          {...draggable.draggableProps}
                          className="p-3 mb-2 bg-white rounded shadow"
                        >
                          <div className="font-medium">{task.title}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
