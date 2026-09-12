using System;
using ClosedXML.Excel;

namespace Carmasters.Core.Application.Backup
{
    /// <summary>
    /// The single place every string coming from garage data is written into a cell.
    /// </summary>
    /// <remarks>
    /// A spreadsheet only evaluates a cell that carries a formula element. Text typed into Excel
    /// by hand is parsed, which is where the leading apostrophe trick comes from, but a value
    /// stored as a string cell is never parsed -- so writing a real text cell is the whole
    /// mitigation, and it keeps the value readable instead of prefixing it with punctuation the
    /// owner never entered.
    ///
    /// What this guarantees, and what the tests assert: the cell is text, it carries no formula,
    /// and reading it back yields exactly what the database held.
    /// </remarks>
    public static class ExcelText
    {
        /// <summary>Characters that make a spreadsheet treat typed input as a formula.</summary>
        private static readonly char[] FormulaLead = new[] { '=', '+', '-', '@', '\t', '\r', '\n' };

        /// <summary>
        /// True when the value would become a formula if a person typed it into a cell. The tests
        /// use this to prove they are exercising the dangerous cases.
        /// </summary>
        public static bool LooksLikeFormula(string value) =>
            !string.IsNullOrEmpty(value) && Array.IndexOf(FormulaLead, value[0]) >= 0;

        /// <summary>
        /// Writes a data string as text. Null and empty both leave the cell blank rather than
        /// writing an empty string, so an unfilled field reads as unfilled.
        /// </summary>
        public static IXLCell WriteText(this IXLCell cell, string value)
        {
            if (string.IsNullOrEmpty(value)) return cell;

            // SetValue takes the string as a value and never parses it, so a cell fed "=1+1"
            // holds those four characters and reports XLDataType.Text. The type is derived from
            // what was written rather than set, which is why the tests assert it instead.
            cell.SetValue(value);
            return cell;
        }
    }
}
