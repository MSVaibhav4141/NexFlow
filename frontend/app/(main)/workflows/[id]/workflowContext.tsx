import { createContext } from "react";

export const WorkflowContext = createContext({
  openDrawer: (nodeId: string, handelerValue?:string) => {},
openSettings: (nodeId: string) => {}
});