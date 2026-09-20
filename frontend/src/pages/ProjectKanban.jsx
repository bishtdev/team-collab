import { useParams } from "react-router-dom";
import KanbanBoard from "../components/KanbanBoard";
import ProjectHeader from "../components/ProjectHeader";

const ProjectKanban = () => {
  const { id: projectId } = useParams();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProjectHeader projectId={projectId} />
      <div className="min-h-0 flex-1">
        <KanbanBoard projectId={projectId} />
      </div>
    </div>
  );
};

export default ProjectKanban;
