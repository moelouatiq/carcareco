import { IProduct } from "../../model";
import { DataItemRowHandle } from "../editabletable/DataIItemRow";
import { useCallback } from "react";

export function useDragAndDrop(
     refreshData: (data: IProduct[]) => void, 
     rowRef: React.RefObject<DataItemRowHandle<IProduct>[] | null[]>,
     dragItemRef: React.RefObject<string | null | undefined>,
     dragOverItemRef: React.RefObject<string | null | undefined>) {

    
    const handleDragStart = useCallback((e: React.DragEvent<HTMLTableRowElement>) => {
        dragItemRef.current = e.currentTarget.id;
    }, [dragItemRef]);
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLTableRowElement>) => {
        dragOverItemRef.current = e.currentTarget.id;
        const values = rowRef.current.map(r => {
            return r?.getValue();
        }).filter(x => x !== null);
        const copyListItems = values as IProduct[];
        if (!dragItemRef.current || !dragOverItemRef.current) return;
        const currentDraggedItemId = dragItemRef.current
        const overItemId = dragOverItemRef.current
        const dragItemContent = copyListItems.find(x => x.id == currentDraggedItemId);
        if (!dragItemContent) return;
        const currentIndex = copyListItems.findIndex(x => x.id == currentDraggedItemId);
        const newIndex = copyListItems.findIndex(x => x.id == overItemId);
        copyListItems.splice(currentIndex, 1);
        copyListItems.splice(newIndex, 0, dragItemContent);
        //dragItem.current = null;
        //dragOverItem.current = null; 
        refreshData(copyListItems);
    }, [dragItemRef, dragOverItemRef, refreshData, rowRef]);

    return {
        handleDragStart,
        handleDragEnter
    }
}
