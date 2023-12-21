'use strict';

module.exports = function(UserPermissionPolicyNode) {
  UserPermissionPolicyNode.quasiRecursiveIncludeFilter = [
    {
      'children': [
        'parent',
        {
          'children': [
            'parent',
            {
              'children': [
                'parent',
                {
                  'children': [
                    'parent',
                    {
                      'children': [
                        'parent',
                        {
                          'children': [
                            'parent',
                            'children',
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  /**
   * [Endpoint] Gets all UserPermissionPolicyNodes
   * @param {object} ctx Current Context
   * @param {Function(Error, object)} callback
   */
  UserPermissionPolicyNode.getUserPermissionPolicyNodes = function(ctx, callback) {
    let filter = {
      where: {
        parentId: null,
      },
      include: UserPermissionPolicyNode.quasiRecursiveIncludeFilter,
    };

    UserPermissionPolicyNode.find(filter, function(err, rootUserPermissionPolicyNodes) {
      if (err) return callback(err);

      return callback(null, rootUserPermissionPolicyNodes);
    });
  };

  UserPermissionPolicyNode.preselectNodes = function(preselectedUserPolicyNodes, callback) {
    let preselectNode = function(node, policyNode) {
      if (node.id == policyNode.id) {
        policyNode.selected = true;
      }      else {
        if (policyNode.children != null) {
          for (let child of policyNode.children) {
            if (preselectNode(node, child)) {
              policyNode.selected = true;
            }
          }
        }
      }

      return policyNode.selected ? true : false;
    };

    UserPermissionPolicyNode.getUserPermissionPolicyNodes(null, function(err, rootUserPermissionPolicyNodes) {
      if (err) return callback(err);

      let parsedUserPermissionPolicyNodes = [];
      for (let rootUserPermissionPolicyNode of rootUserPermissionPolicyNodes) {
        parsedUserPermissionPolicyNodes.push(rootUserPermissionPolicyNode.toJSON());
      }

      for (let node of preselectedUserPolicyNodes) {
        for (let parsedUserPermissionPolicyNode of parsedUserPermissionPolicyNodes) {
          preselectNode(node, parsedUserPermissionPolicyNode);
        }
      }

      return callback(null, parsedUserPermissionPolicyNodes);
    });
  };
};
