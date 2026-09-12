using System;
using System.Globalization;

namespace Carmasters.Core.Application.Backup
{
    /// <summary>
    /// How the download presents itself. Kept beside the workbook so the name and the media type
    /// are asserted by tests rather than spelled out in a controller.
    /// </summary>
    public static class GarageBackupFile
    {
        public const string ContentType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        /// <summary>
        /// The name the owner sees when the file lands. Built from the garage's own clock, so a
        /// backup taken at half past nine in the morning is not stamped with the evening before.
        /// The culture is fixed because this is a file name, not text shown in the interface.
        /// </summary>
        public static string NameFor(DateTime localTime) =>
            "Sauvegarde_Garage_"
            + localTime.ToString("yyyy-MM-dd_HHmm", CultureInfo.InvariantCulture)
            + ".xlsx";
    }
}
