"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/app/components/layout/admin-layout";
import { adminService } from "@/lib/services/admin-service";
import { db, firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import styles from "./users.module.css";
import { Button } from "../components/ui/button";

const initialUsers = [];

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [admin, setAdmin] = useState();
  const [adminRole, setAdminRole] = useState();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userStr = localStorage.getItem("user");
        const userData = JSON.parse(userStr);
        const response = await adminService.getAdminById(userData.id);
        setAdmin(response);

        // Fetch users from Firebase
        const usersCollection = collection(db, "Users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        console.log(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  console.log('Users:', users);

  useEffect(() => {
    const fetchRole = async () => {
      if (admin?.roleId) {
        try {
          const response = await adminService.getRoleById(admin.roleId);
          setAdminRole(response);
        } catch (err) {
          console.error(err);
        }
      }
    };

    fetchRole();
  }, [admin]);

  const hasManageUsersPermission = adminRole?.permissions?.find(
    (permission) =>
      permission.featureTitle === "Manage Users" &&
      permission.types.includes("read")
  );

  const canUpdateUsers = adminRole?.permissions?.find(
    (permission) =>
      permission.featureTitle === "Manage Users" &&
      permission.types.includes("update")
  );

  const canWriteUsers = adminRole?.permissions?.find(
    (permission) =>
      permission.featureTitle === "Manage Users" &&
      permission.types.includes("write")
  );

  const handleEditUser = (userId) => { };
  const handleBlockUser = (userId) => {
    if (window.confirm("Are you sure you want to block this user?")) {
      setUsers(
        users.map((user) =>
          user.id === userId
            ? {
              ...user,
              subscriptionStatus:
                user.subscriptionStatus === true ? false : true,
            }
            : user
        )
      );
    }
  };

  const handleResetPassword = (userId) => {
    if (
      window.confirm("Are you sure you want to reset this user's password?")
    ) {
      // TODO: Implement password reset API call
      alert("Password reset email has been sent to the user.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();

    const hdidMatch = user.HDID?.toLowerCase().includes(query);
    const status = user.subscriptionStatus === true ? "active" : "inactive";
    const statusMatch = status.includes(query);

    return hdidMatch || statusMatch;
  });

  return (
    <AdminLayout>
      {hasManageUsersPermission ? (
        <>
          <div>
            <div className={styles.header}>
              <h2 className={styles.title}>Users Management</h2>
            </div>

            <div className={styles.card}>
              <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                  <div className={styles.searchIcon}>
                    {/* <Search className="h-4 w-4 text-gray-400" /> */}
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={styles.tableHeaderCell}>HDID</th>
                  <th className={styles.tableHeaderCell}>Subscription Status</th>
                  <th className={styles.tableHeaderCell}>Active Plan</th>
                  <th className={styles.tableHeaderCell}>Start Date</th>
                  <th className={styles.tableHeaderCell}>End Date</th>
                  <th className={styles.tableHeaderCell}>Join Date</th>
                  <th className={styles.tableHeaderCell}>Points Balance</th>
                  <th className={styles.tableHeaderCell}>Failed Transactions</th>
                  {(canUpdateUsers || canWriteUsers) && (
                    <th className={styles.tableHeaderCell}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filteredUsers.map((user) => {
                  const isBlocked = user.subscriptionStatus === "Blocked";
                  const isActive =
                    user.subscriptionStatus === true ||
                    user.subscriptionStatus === "Active";

                  return (
                    <tr key={user.id}>
                      <td className={styles.tableCell}>{user.HDID}</td>
                      <td className={styles.tableCell}>
                        <span
                          className={`${styles.status} ${isBlocked ? styles.blocked : ""
                            }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        {user.subscriptionPlan?.planName ?? "N/A"}
                      </td>
                      <td className={styles.tableCell}>
                        {user.subscriptionPlan?.createdAt?.toDate
                          ? user.subscriptionPlan.createdAt
                            .toDate()
                            .toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className={styles.tableCell}>
                        {user.subscriptionEndDate ?? "N/A"}
                      </td>
                      <td className={styles.tableCell}>
                        {user.createdAt?.toDate
                          ? user.createdAt.toDate().toLocaleString()
                          : "N/A"}
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.encrypted}>
                          {user.pointsBalanceEncrypted ?? "N/A"}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        {user.failedTransactions ?? 0}
                      </td>
                      {(canUpdateUsers || canWriteUsers) && (
                        <td className={styles.tableCell}>
                          <div className={styles.actionButtons}>
                            {canUpdateUsers && (
                              <Button
                                variant="primary"
                                onClick={() => handleBlockUser(user.id)}
                              >
                                {isActive ? "Block" : "Unblock"}
                              </Button>
                            )}
                            {canWriteUsers && (
                              <Button
                                onClick={() => handleResetPassword(user.id)}
                              >
                                Reset Password
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.header}>
          <h2 className={styles.title}>Access Denied</h2>
          <p>You do not have permission to access User Management.</p>
        </div>
      )}
    </AdminLayout>
  );
}

