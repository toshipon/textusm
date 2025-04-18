import { useContext } from "react";
import { CanvasContext } from "../CanvasProvider";
import { HypothesisCanvasData } from "../components/HypothesisCanvas";

export function useCanvasItems() {
  const { dispatch } = useContext(CanvasContext);

  return {
    updateSection: (section: keyof HypothesisCanvasData, content: string) => {
      dispatch({
        type: "UPDATE_SECTION",
        payload: { section, content },
      });
    },
    loadCanvas: (data: HypothesisCanvasData) => {
      dispatch({ type: "LOAD_CANVAS", payload: data });
    },
  };
}
