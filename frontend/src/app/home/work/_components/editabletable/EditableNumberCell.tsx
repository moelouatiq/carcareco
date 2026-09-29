import React, { useState, useImperativeHandle } from "react";
import { formatMoney } from "@/_lib/money";
import { EditableCellHandle, IEditableNumericCellProps, Input } from "./EditableCell";

const EditableNumberCell = React.forwardRef<EditableCellHandle<number|null>, IEditableNumericCellProps<number|null>>((props, ref) => {
    const {
        defaultValue, placeholder, id, name, isEditing, className, step, isMoney, isPercentage, required, onValueChange
    } = props;

    const [internalValue, setInternalValue] = useState(defaultValue);

    useImperativeHandle(ref, () => ({
        getValue(): number | null{
            return internalValue;
        },
        setValue(value: number |  null) {
            setInternalValue(value);
            onValueChange?.(value);
        },
    }));

    const getFormattedValue = () => {
        if (internalValue === 0) return '';
        if (isMoney) {
            if (!internalValue) return '';
            return formatMoney(internalValue);
        }
        if (isPercentage) return internalValue + ' %';
        return internalValue;
    };
    if (!isEditing) return getFormattedValue();

    return Input(required, id, name, "number", step, placeholder, internalValue, (e) => {
        const value = +e.currentTarget.value;
        setInternalValue(value);
        onValueChange?.(value);
    }, className);

});
EditableNumberCell.displayName = "EditableNumberCell";
export {
    EditableNumberCell
}
