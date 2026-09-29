import React, { useImperativeHandle, useState } from "react";
import { EditableCellHandle, EditableTextCell } from "./EditableCell";
import { EditableNumberCell } from "./EditableNumberCell";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/16/solid"; 
import clsx from "clsx"; 
import { IProduct } from "../../model";
import { Bars3Icon } from "@heroicons/react/20/solid";
import { EditableCodeCell } from "./EditableCodeCell";
import { labels } from "@/_lib/labels";
import { formatMoney } from "@/_lib/money";
import { calculateWorkLineTotal, DEFAULT_WORK_LINE_DISCOUNT, DEFAULT_WORK_LINE_UNIT } from "../../workLine";

// Shared with the header in Saleables so both halves of the table sit on one horizontal grid.
export const cellPadding = "px-3 py-2.5";

export type DataItemRowHandle<T> = {
    getValue: () => T;
};

interface IRemoveItemHandle {
    (id:string): void
}

interface IOnDragHandle{
    (e:React.DragEvent<HTMLTableRowElement>):void
}
 

interface IDataItemRowProps {
    isEditing: boolean, 
    index: number, 
    item: IProduct, 
    onDragStart: IOnDragHandle, 
    onDragEnter: IOnDragHandle, 
     removeWorkItem: IRemoveItemHandle
};


//TODO maybe update only row when changing and on submit collect and submit
const DataItemRow = React.forwardRef<DataItemRowHandle<IProduct>, IDataItemRowProps>((props, ref) => {
 
    const { isEditing, index, item,  onDragStart,  onDragEnter,  removeWorkItem } = props; 
   
    const codeRef = React.useRef<EditableCellHandle<string>>(null);
    const nameRef = React.useRef<EditableCellHandle<string>>(null);
    const priceRef = React.useRef<EditableCellHandle<number>>(null);
    const quantityRef = React.useRef<EditableCellHandle<number>>(null);
    const [price, setPrice] = useState(item.price);
    const [quantity, setQuantity] = useState(item.quantity);
    const discount = item.discount ?? DEFAULT_WORK_LINE_DISCOUNT;
    const unit = item.unit || DEFAULT_WORK_LINE_UNIT;

    useImperativeHandle(ref, () => ({
        
        getValue() {
            return {
                id: item?.id,
                code: codeRef.current?.getValue()??'',
                name: nameRef.current?.getValue()??'',
                price: priceRef.current?.getValue()??null,
                unit,
                quantity: quantityRef.current?.getValue()??null,
                discount,
            };
        }
    }));
 
    const textSize = clsx("rounded-sm border border-line bg-surface px-2 text-sm/7 font-medium text-ink focus:border-accent focus:outline-none");
    const pricePropsClass = clsx(textSize, "text-right ");
    const codeStyle = clsx(textSize,   "w-full");
    const nameStyle = clsx( textSize, "w-full ");
    const tdStyle = clsx(cellPadding, "border-b border-line text-sm whitespace-nowrap align-middle",
        isEditing ? "text-muted" : "text-ink");
   
    return (
    <>
      <tr 
      key={ index.toString()} 
      id={item.id?.toString()} 
      draggable={isEditing}    
      onDragStart={onDragStart} 
      onDragEnter={onDragEnter}  
      >
        {isEditing && <>
            <td className={clsx(tdStyle, "w-10")}>
            <input type="hidden" value={item.id} name="id"/>
            <input type="hidden" value={unit} name="unit" readOnly />
            <input type="hidden" value={discount} name="discount" readOnly />
            {/* The row is dragged by its handle, so the handle needs a name of its own. */}
            <button
                type="button"
                aria-label={labels.work.reorderRow}
                className="cursor-grab text-muted hover:text-ink"
            >
                <Bars3Icon aria-hidden="true" className="size-4" />
            </button>
        </td>
        </>}
       
        <td className={clsx("w-28 min-w-28 sm:w-40 sm:min-w-40",tdStyle)} >
          
            <EditableCodeCell //todo auto complete 
                placeholder={labels.common.codePlaceholder}
                defaultValue={item.code}
                isEditing={isEditing}
                ref={codeRef}
                id={item.id}
                name='part'
                className={codeStyle}
                nameRef={nameRef}
                priceRef={priceRef}
            >
            </EditableCodeCell>
        </td>
        <td className={clsx("w-full min-w-44 sm:min-w-64",tdStyle)}  >
                <EditableTextCell
                    id={item.id}
                    name='name'
                    className={nameStyle}
                    required={true}
                    ref={nameRef}
                    placeholder={labels.common.noValue}
                    defaultValue={item.name}
                    isEditing={isEditing}
                >
                </EditableTextCell> 
        </td>
        <td className={clsx("w-15  text-end",tdStyle)}  >
        <EditableNumberCell   
                        placeholder=""
                        ref={quantityRef}
                        id={item.id}
                        name='quantity'
                        step="any"
                        defaultValue={item.quantity}
                        onValueChange={setQuantity}
                        className={clsx("w-15",pricePropsClass)}
                        isEditing={isEditing}>
                    </EditableNumberCell> 
            </td>
        <td className={clsx("w-20 text-end",tdStyle)}  >
        <EditableNumberCell
                    id={item.id}
                    name='price'
                        placeholder=""
                        defaultValue={item.price}
                        isMoney={true}
                        required={true}
                        step="any"
                        onValueChange={setPrice}
                        className={clsx("w-20",pricePropsClass)}
                        ref={priceRef}
                        isEditing={isEditing}></EditableNumberCell>
        </td>
        <td className={clsx("w-28 text-end font-medium text-ink",tdStyle)}>
            {formatMoney(calculateWorkLineTotal(quantity, price, discount))}
        </td>
      
        {isEditing && <td className={clsx(tdStyle, "w-10 text-right")}>
            <Link color="link" href="#"
                aria-label={labels.work.removeRow}
                className="inline-flex text-muted hover:text-danger-ink"
                onClick={(e) =>
                 {
                    e.preventDefault();
                    removeWorkItem(item.id)
                 }
                 }>
                <XMarkIcon aria-hidden="true" className="size-4"></XMarkIcon>
            </Link>
        </td>}
    </tr>
    </>
  
    )
})

DataItemRow.displayName = 'DataItemRow'
export {
    DataItemRow
}
