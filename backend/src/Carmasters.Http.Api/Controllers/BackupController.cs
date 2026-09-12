using System;
using Carmasters.Core.Application.Backup;
using Carmasters.Core.Application.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
// Microsoft.AspNetCore.Http also defines ISession, so the ORM one is named explicitly.
using ISession = NHibernate.ISession;

namespace Carmasters.Http.Api.Controllers
{
    /// <summary>
    /// Hands the garage owner a readable copy of their own business data.
    /// </summary>
    /// <remarks>
    /// The action takes no arguments, deliberately. The data it returns is whatever the injected
    /// session is connected to, and that database is chosen from the authenticated principal's
    /// Spn claim inside MultiTenancyConnectionDriver -- so there is no tenant, client or user
    /// parameter for a caller to supply, and nothing to validate.
    /// </remarks>
    [TenantRateLimit]
    [Authorize(Policy = "ServerSidePolicy")]
    [Route("api/[controller]")]
    [ApiController]
    public class BackupController : ControllerBase
    {
        private readonly ISession session;
        private readonly ILogger<BackupController> logger;

        public BackupController(ISession session, ILogger<BackupController> logger)
        {
            this.session = session;
            this.logger = logger;
        }

        [HttpGet("excel")]
        public IActionResult Excel()
        {
            try
            {
                // The connection belongs to NHibernate's session scope: read through it, never
                // close or dispose it.
                var data = new GarageBackupReader(session.Connection).Read();
                var workbook = new GarageBackupWorkbook().Build(data);

                var fileName = GarageBackupFile.NameFor(
                    TimeZoneInfo.ConvertTimeFromUtc(data.GeneratedAtUtc, GarageTimeZone()));

                // Built and returned in memory: nothing is written to the container's disk.
                return File(workbook, GarageBackupFile.ContentType, fileName);
            }
            catch (Exception ex)
            {
                logger.LogError("Error building the garage backup. Type: {ExceptionType}", ex.GetType().Name);
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to build the backup");
            }
        }

        private static TimeZoneInfo GarageTimeZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("Africa/Casablanca"); }
            catch (TimeZoneNotFoundException) { return TimeZoneInfo.Utc; }
            catch (InvalidTimeZoneException) { return TimeZoneInfo.Utc; }
        }
    }
}
