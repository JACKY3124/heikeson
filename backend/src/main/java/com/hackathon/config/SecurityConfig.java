package com.hackathon.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 认证相关：公开
                .requestMatchers("/api/auth/**").permitAll()
                // 公开接口：赛事列表、榜单查看等无需登录
                .requestMatchers(HttpMethod.GET, "/api/competitions", "/api/competitions/*/rankings").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/competitions/*", "/api/competitions/*/registration/status").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/announcements").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/submissions/*/comments").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/submissions/*/scores").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                // 契约: 报名/提交/评论(POST) 需登录
                .requestMatchers(HttpMethod.POST, "/api/competitions/*/register").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/competitions/*/registration/withdraw").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/competitions/*/submissions").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/submissions/*/comments").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/competitions/*/submissions").authenticated()
                // 管理员专属
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // 专家专属
                .requestMatchers("/api/expert/**").hasRole("EXPERT")
                // 选手专属
                .requestMatchers("/api/player/**").hasRole("PLAYER")
                // 其余需登录
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
