// src/components/KanbanBoard.jsx
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../services/api';

const statuses = ['todo', 'in-progress', 'done'];

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const res = await api.get(`/tasks?projectId=${projectId}`);
    setTasks(res.data);
  };

  useEffect(() => {
    if (projectId) fetchTasks();
  }, [projectId]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const destStatus = result.destination.droppableId;
    try {
      await api.put(`/tasks/${taskId}`, { status: destStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const grouped = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  return (
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
  );
};

export default KanbanBoard;
