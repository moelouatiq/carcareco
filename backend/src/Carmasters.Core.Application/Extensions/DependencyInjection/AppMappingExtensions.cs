using Dapper;
using Microsoft.Extensions.DependencyInjection;

namespace Carmasters.Core.Application.Extensions.DependencyInjection
{
    public static class AppMappingExtensions
    {
        public static IServiceCollection AddAppMapping(this IServiceCollection services)
        {
            SqlMapper.AddTypeHandler(new Carmasters.Core.Application.Dapper.JsonNodeTypeHandler());
            services.AddSingleton<IAppMapper, AppMapper>();
            return services;
        }
    }
}
