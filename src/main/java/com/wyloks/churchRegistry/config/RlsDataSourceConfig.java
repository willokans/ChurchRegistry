package com.wyloks.churchRegistry.config;

import com.wyloks.churchRegistry.security.RlsSessionContext;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Wraps the DataSource to set PostgreSQL session variables (app.parish_ids, app.is_admin)
 * for RLS policies when a connection is obtained. Only active when RLS is enabled.
 */
@Configuration
@Profile("!auth-slice")
@ConditionalOnProperty(name = "app.rls.enabled", havingValue = "true", matchIfMissing = false)
public class RlsDataSourceConfig {

    @Bean
    @Primary
    public DataSource rlsDataSource(DataSource dataSource) {
        return new RlsAwareDataSource(dataSource);
    }

    /**
     * DataSource that sets RLS session variables when a connection is obtained.
     */
    private static final class RlsAwareDataSource extends DelegatingDataSource {

        RlsAwareDataSource(DataSource targetDataSource) {
            super(targetDataSource);
        }

        @Override
        public Connection getConnection() throws SQLException {
            Connection conn = getTargetDataSource().getConnection();
            applyRlsSessionVars(conn);
            return conn;
        }

        @Override
        public Connection getConnection(String username, String password) throws SQLException {
            Connection conn = getTargetDataSource().getConnection(username, password);
            applyRlsSessionVars(conn);
            return conn;
        }

        private void applyRlsSessionVars(Connection conn) throws SQLException {
            RlsSessionContext.RlsValues values = RlsSessionContext.get();
            String parishIds = values.parishIdsAsCommaSeparated();
            String isAdmin = values.isAdmin() ? "true" : "false";
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("SET LOCAL app.parish_ids = '" + parishIds.replace("'", "''") + "'");
                stmt.execute("SET LOCAL app.is_admin = '" + isAdmin + "'");
            }
        }
    }
}
