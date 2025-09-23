using Microsoft.AspNetCore.Mvc;
using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly IConfigurationService _configurationService;
        private readonly ILogger<TeamsController> _logger;

        public TeamsController(
            IConfigurationService configurationService,
            ILogger<TeamsController> logger)
        {
            _configurationService = configurationService;
            _logger = logger;
        }

        /// <summary>
        /// Get all available teams
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamSummary>>> GetTeams()
        {
            try
            {
                var teams = await _configurationService.GetAllTeamConfigurationsAsync();
                var teamSummaries = teams.Select(team => new TeamSummary
                {
                    TeamName = team.TeamName,
                    DisplayName = team.DisplayName,
                    Description = team.Description,
                    ActiveCategoriesCount = team.Categories.Count(c => c.IsActive),
                    EnabledDataSourcesCount = team.DataSources.Count(ds => ds.IsEnabled),
                    UpdatedAt = team.UpdatedAt
                }).OrderBy(t => t.DisplayName).ToList();

                _logger.LogInformation("Retrieved {Count} team configurations", teamSummaries.Count);
                return Ok(teamSummaries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading team configurations");
                return StatusCode(500, "Internal server error while loading teams");
            }
        }

        /// <summary>
        /// Get detailed configuration for a specific team
        /// </summary>
        [HttpGet("{teamName}")]
        public async Task<ActionResult<TeamConfiguration>> GetTeam(string teamName)
        {
            try
            {
                var team = await _configurationService.GetTeamConfigurationAsync(teamName);
                if (team == null)
                {
                    return NotFound($"Team '{teamName}' not found");
                }

                _logger.LogInformation("Retrieved configuration for team {TeamName}", teamName);
                return Ok(team);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading team configuration for {TeamName}", teamName);
                return StatusCode(500, "Internal server error while loading team configuration");
            }
        }

        /// <summary>
        /// Get active categories for a specific team
        /// </summary>
        [HttpGet("{teamName}/categories")]
        public async Task<ActionResult<IEnumerable<CategoryConfiguration>>> GetTeamCategories(string teamName)
        {
            try
            {
                var categories = await _configurationService.GetActiveCategoriesAsync(teamName);
                if (!categories.Any())
                {
                    var team = await _configurationService.GetTeamConfigurationAsync(teamName);
                    if (team == null)
                    {
                        return NotFound($"Team '{teamName}' not found");
                    }
                }

                _logger.LogInformation("Retrieved {Count} active categories for team {TeamName}", 
                    categories.Count(), teamName);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading categories for team {TeamName}", teamName);
                return StatusCode(500, "Internal server error while loading team categories");
            }
        }

        /// <summary>
        /// Get enabled data sources for a specific team
        /// </summary>
        [HttpGet("{teamName}/datasources")]
        public async Task<ActionResult<IEnumerable<DataSourceConfiguration>>> GetTeamDataSources(string teamName)
        {
            try
            {
                var dataSources = await _configurationService.GetEnabledDataSourcesAsync(teamName);
                if (!dataSources.Any())
                {
                    var team = await _configurationService.GetTeamConfigurationAsync(teamName);
                    if (team == null)
                    {
                        return NotFound($"Team '{teamName}' not found");
                    }
                }

                _logger.LogInformation("Retrieved {Count} enabled data sources for team {TeamName}", 
                    dataSources.Count(), teamName);
                return Ok(dataSources);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading data sources for team {TeamName}", teamName);
                return StatusCode(500, "Internal server error while loading team data sources");
            }
        }

        /// <summary>
        /// Get triage settings for a specific team
        /// </summary>
        [HttpGet("{teamName}/triage-settings")]
        public async Task<ActionResult<TriageConfiguration>> GetTeamTriageSettings(string teamName)
        {
            try
            {
                var team = await _configurationService.GetTeamConfigurationAsync(teamName);
                if (team == null)
                {
                    return NotFound($"Team '{teamName}' not found");
                }

                _logger.LogInformation("Retrieved triage settings for team {TeamName}", teamName);
                return Ok(team.TriageSettings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading triage settings for team {TeamName}", teamName);
                return StatusCode(500, "Internal server error while loading team triage settings");
            }
        }

        /// <summary>
        /// Update team configuration
        /// </summary>
        [HttpPut("{teamName}")]
        public async Task<ActionResult<TeamConfiguration>> UpdateTeam(string teamName, [FromBody] TeamConfiguration configuration)
        {
            try
            {
                if (configuration.TeamName != teamName)
                {
                    return BadRequest("Team name in URL does not match configuration team name");
                }

                await _configurationService.SaveTeamConfigurationAsync(configuration);
                
                _logger.LogInformation("Updated configuration for team {TeamName}", teamName);
                return Ok(configuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating team configuration for {TeamName}", teamName);
                return StatusCode(500, "Internal server error while updating team configuration");
            }
        }
    }

    // DTOs for API responses
    public class TeamSummary
    {
        public string TeamName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ActiveCategoriesCount { get; set; }
        public int EnabledDataSourcesCount { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
