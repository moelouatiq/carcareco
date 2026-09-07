using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace Carmasters.Core.Application.Errors
{
    public class InvalidModelStateJsonResponseFactory
    {
        public static IActionResult Handle(ActionContext actionContext)
        {
            var modelError = actionContext.ModelState.Keys.SelectMany(k => actionContext.ModelState[k].Errors).FirstOrDefault();
            if (modelError != null)
            {
                var badResponse = new BadRequestObjectResult(new JsonErrorDto(modelError.ErrorMessage, null));
                return badResponse;
            }
            return new BadRequestObjectResult(new JsonErrorDto("Invalid model error exception occured, see logs",null));

        }
    }
}
