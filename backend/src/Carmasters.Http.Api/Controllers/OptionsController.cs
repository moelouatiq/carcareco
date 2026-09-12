using System;
using System.Threading.Tasks;
using Carmasters.Core.Application.Configuration;
using Carmasters.Core.Application.RateLimiting;
using Carmasters.Core.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Carmasters.Http.Api.Controllers
{
    [TenantRateLimit]
    [Authorize(Policy = "ServerSidePolicy")]
    [Route("api/[controller]")]
    [ApiController]
    public class OptionsController : ControllerBase
    {
        private readonly ITenantConfigService tenantConfigService;
        private readonly ILogger<OptionsController> logger;

        public OptionsController(
            ITenantConfigService tenantConfigService,
            ILogger<OptionsController> logger)
        {
            this.tenantConfigService = tenantConfigService;
            this.logger = logger;
        }

        [HttpGet()]
        public async Task<ActionResult<AppOptions>> Get()
        {
            try
            {
                return await tenantConfigService.GetAppOptionsAsync();
            }
            catch (Exception ex)
            {
                logger.LogError("Error retrieving tenant configuration. Type: {ExceptionType}", ex.GetType().Name);
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to retrieve configuration");
            }
        }

        [HttpPut]
        public async Task<ActionResult> Post([FromBody] AppOptions appOptions)
        {
            try
            {
                await tenantConfigService.SaveAppOptionsAsync(appOptions);
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError("Error saving tenant configuration. Type: {ExceptionType}", ex.GetType().Name);
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to save configuration");
            }
        }
    }
}
