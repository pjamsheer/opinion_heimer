import frappe

def create_opinino_user_table():
    frappe.db.sql(
        """create table if not exists `__Opinion User` (
            `poll_name` VARCHAR(140) NOT NULL,
            `opinion_name` VARCHAR(255) NOT NULL,
            `opinion_user` VARCHAR(140) NOT NULL,
            PRIMARY KEY (`poll_name`, `opinion_name`, `opinion_user`)
        ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci"""
    )
