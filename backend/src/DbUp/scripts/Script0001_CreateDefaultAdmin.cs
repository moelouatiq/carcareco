using System.Data;
using Npgsql;
using Carmasters.Core.Application.Authorization;

namespace DbUp.Scripts
{
    /// <summary>
    /// Script to create a default admin user with a pre-defined password hash
    /// and profile image during database initialization
    /// </summary> 
    internal class Script0001_CreateDefaultAdmin : DbUp.Engine.IScript
    {
        public string ProvideScript(Func<IDbCommand> dbCommandFactory)
        {
            var adminUsername = GetRequiredEnvironmentVariable("CARCARE_ADMIN_USERNAME");
            var adminPassword = GetRequiredEnvironmentVariable("CARCARE_ADMIN_PASSWORD");
            var adminEmail = Environment.GetEnvironmentVariable("CARCARE_ADMIN_EMAIL") ?? "admin@example.invalid";
            var passwordHash = PasswordHasher.getHash(adminPassword);

            // Read profile image
            byte[] profileImage;
            string imagePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "resources", "default_admin.png");

            Console.WriteLine($"Loading admin profile image from: {imagePath}");

            if (File.Exists(imagePath))
            {
                profileImage = File.ReadAllBytes(imagePath);
                Console.WriteLine($"Successfully loaded profile image: {profileImage.Length} bytes");
            }
            else
            {
                Console.WriteLine($"Warning: Profile image not found at {imagePath}");
                // Create a fallback array so the script doesn't fail
                profileImage = new byte[0];
            }

            // Generate a default employee ID for the admin
            var employeeId = Guid.NewGuid();

            var command = (NpgsqlCommand)dbCommandFactory();
            command.CommandText = @"INSERT INTO domain.employee (
                        id, firstname, lastname, email, phone, proffession, description, introducedat
                    ) VALUES (
                        @Id, 'System', 'Administrator', 'admin@example.com', '', 'Administrator', 'Default system administrator', CURRENT_TIMESTAMP
                    )";

            using (command)
            {
                command.Parameters.AddWithValue("@Id", employeeId);
                command.ExecuteNonQuery();
                Console.WriteLine($"Created employee record with ID: {employeeId}");
            }
            command = (NpgsqlCommand)dbCommandFactory();
            command.CommandText = @"INSERT INTO public.user (
                        username, password, tenantname, email, validated, profile_image, employeeid
                    ) VALUES (
                        @Username, @Password, 'template', @Email, @Validated, @ProfileImage, @EmployeeId
                    )";

            using (command)
            {
                command.Parameters.AddWithValue("@Username", adminUsername);
                command.Parameters.AddWithValue("@Password", passwordHash);
                command.Parameters.AddWithValue("@Email", adminEmail);
                command.Parameters.AddWithValue("@Validated", true);
                command.Parameters.AddWithValue("@ProfileImage", profileImage);
                command.Parameters.AddWithValue("@EmployeeId", employeeId);
                command.ExecuteNonQuery();
                Console.WriteLine("Successfully created default admin user");
            }

            return "";
        }

        private static string GetRequiredEnvironmentVariable(string name)
        {
            var value = Environment.GetEnvironmentVariable(name);
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException($"Required environment variable {name} is missing. Run the setup-secrets script first.");
            }

            return value;
        }
    }
}
