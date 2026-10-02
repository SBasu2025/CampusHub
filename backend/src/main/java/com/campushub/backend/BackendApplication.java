package com.campushub.backend;

import com.campushub.backend.entity.Admin;
import com.campushub.backend.repository.AdminRepository;
import com.campushub.backend.service.AdminService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(
                BackendApplication.class,
                args
        );
    }

    @Bean
    CommandLineRunner createInitialAdmin(
            AdminRepository adminRepository,
            AdminService adminService
    ) {
        return args -> {

            /*
             * Bootstrap only:
             *
             * If there are no admins in the database,
             * create the first administrator automatically.
             *
             * The AdminService generates the CampusHub ID,
             * so we do NOT manually provide an admin ID here.
             */
            if (adminRepository.count() == 0) {

                Admin admin = new Admin();

                admin.setAdminName(
                        "System Administrator"
                );

                Admin savedAdmin =
                        adminService.saveAdmin(admin);

                System.out.println(
                        "================================================="
                );
                System.out.println(
                        " INITIAL CAMPUSHUB ADMIN CREATED"
                );
                System.out.println(
                        " Admin Name : "
                                + savedAdmin.getAdminName()
                );
                System.out.println(
                        " Admin ID   : "
                                + savedAdmin.getAdminId()
                );
                System.out.println(
                        "================================================="
                );

            } else {

                System.out.println(
                        "CampusHub ADMIN table already contains "
                                + adminRepository.count()
                                + " admin account(s)."
                );
            }
        };
    }
}